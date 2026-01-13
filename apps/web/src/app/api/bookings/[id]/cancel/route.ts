/**
 * Booking Cancellation API
 * 
 * Handles cancellation with penalties:
 * - Customer: Free if >24h before, 50% fee if <24h
 * - Cleaner: Strike + $25 penalty if <2h before
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';
import { sendSMSNotification } from '@/lib/sms';
import { sendEmailNotification } from '@/lib/email';
import { UserRole, BookingStatus, CleanerStatus } from '@prisma/client';

const cancelSchema = z.object({
    reason: z.string().min(10).max(500),
});

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reason } = cancelSchema.parse(body);

        // Get booking with all relations
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                user: true,
                payment: true,
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: {
                        cleaner: { include: { user: true } }
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify user can cancel (owner, assigned cleaner, or admin)
        const isCustomer = booking.userId === session.user.id;
        const assignedCleaner = booking.assignments[0]?.cleaner;
        const isCleaner = assignedCleaner?.userId === session.user.id;
        const isAdmin = session.user.role === UserRole.ADMIN;

        if (!isCustomer && !isCleaner && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
        }

        // Check if booking can be cancelled
        const nonCancellableStatuses: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'REFUNDED'];
        if (nonCancellableStatuses.includes(booking.status)) {
            return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
        }

        // Get financial settings
        const settings = await prisma.financialSettings.findFirst();
        const freeCancelHours = settings?.freeCancelHours ?? 24;
        const lateCancelFeePercent = settings?.lateCancelFeePercent ?? 0.50;
        const cleanerStrikePenalty = settings?.cleanerStrikePenalty ?? 25;
        const maxStrikes = settings?.maxStrikes ?? 3;

        // Calculate hours until service
        const hoursUntilService = (new Date(booking.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60);

        let cancellationFee = 0;
        let refundAmount = booking.totalPrice;
        let cleanerPenalty = 0;
        let addStrike = false;

        // Determine cancellation fees based on who is cancelling
        if (isCleaner) {
            // Cleaner cancellation logic
            if (hoursUntilService < 2) {
                // Very late cancellation - strike + penalty
                addStrike = true;
                cleanerPenalty = cleanerStrikePenalty;
                console.log(`[Cancel] Cleaner late cancellation (<2h). Adding strike and $${cleanerPenalty} penalty.`);
            } else if (hoursUntilService < 24) {
                // Late but not critical - just strike
                addStrike = true;
                console.log(`[Cancel] Cleaner cancellation <24h. Adding strike.`);
            }
            // Customer gets full refund when cleaner cancels
            refundAmount = booking.totalPrice;
        } else if (isCustomer) {
            // Customer cancellation logic
            if (hoursUntilService < freeCancelHours) {
                // Late cancellation - apply fee
                cancellationFee = booking.totalPrice * lateCancelFeePercent;
                refundAmount = booking.totalPrice - cancellationFee;
                console.log(`[Cancel] Customer late cancellation. Fee: $${cancellationFee.toFixed(2)}`);
            }
        }
        // Admin can cancel without fees

        // Process refund via Stripe
        const stripe = await getStripeClient();
        let refundId = null;

        if (booking.payment?.stripePaymentIntentId && refundAmount > 0) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: booking.payment.stripePaymentIntentId,
                    amount: Math.round(refundAmount * 100), // cents
                    reason: 'requested_by_customer',
                    metadata: {
                        bookingId: booking.id,
                        cancelledBy: isCleaner ? 'cleaner' : (isCustomer ? 'customer' : 'admin'),
                        cancellationFee: cancellationFee.toString()
                    }
                });
                refundId = refund.id;
            } catch (err) {
                console.error('[Cancel] Refund failed:', err);
                // Continue with cancellation even if refund fails
            }
        }

        // Update booking
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledBy: session.user.id,
                cancellationReason: reason,
                cancellationFee: cancellationFee
            }
        });

        // Update payment record
        if (booking.payment && refundId) {
            await prisma.payment.update({
                where: { id: booking.payment.id },
                data: {
                    status: cancellationFee > 0 ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
                    refundedAmount: refundAmount,
                    refundedAt: new Date(),
                    stripeRefundId: refundId
                }
            });
        }

        // Handle cleaner penalties
        if (assignedCleaner && (addStrike || cleanerPenalty > 0)) {
            const currentStrikes = assignedCleaner.strikes || 0;
            const newStrikes = addStrike ? currentStrikes + 1 : currentStrikes;

            // Parse existing strike reasons
            let strikeReasons: string[] = [];
            try {
                strikeReasons = JSON.parse(assignedCleaner.strikeReasons || '[]');
            } catch { /* empty */ }
            
            if (addStrike) {
                strikeReasons.push(`${new Date().toISOString()}: Cancelled booking ${booking.id} with ${hoursUntilService.toFixed(1)}h notice`);
            }

            // Check if cleaner should be suspended
            const shouldSuspend = newStrikes >= maxStrikes;

            await prisma.cleanerProfile.update({
                where: { id: assignedCleaner.id },
                data: {
                    strikes: newStrikes,
                    lastStrikeAt: addStrike ? new Date() : undefined,
                    strikeReasons: JSON.stringify(strikeReasons),
                    jobsCancelled: { increment: 1 },
                    cancellationsLast30: { increment: 1 },
                    status: shouldSuspend ? CleanerStatus.SUSPENDED : undefined
                }
            });

            // Notify cleaner about strike
            if (addStrike) {
                const cleanerUser = assignedCleaner.user;
                const warningMsg = shouldSuspend
                    ? `⚠️ Your account has been suspended due to ${newStrikes} cancellations. Please contact support.`
                    : `⚠️ You received a strike for late cancellation (${newStrikes}/${maxStrikes}). Please try to give more notice.`;

                if (cleanerUser.phone) {
                    await sendSMSNotification(cleanerUser.id, cleanerUser.phone, warningMsg, { type: 'STRIKE' });
                }
                await sendEmailNotification(cleanerUser.id, {
                    to: cleanerUser.email,
                    subject: shouldSuspend ? 'Account Suspended' : 'Cancellation Strike Warning',
                    html: `<p>${warningMsg}</p>`
                }, { type: 'STRIKE' });
            }
        }

        // Update cleaner assignment status
        if (booking.assignments.length > 0) {
            await prisma.cleanerAssignment.updateMany({
                where: { bookingId: booking.id },
                data: { status: 'CANCELLED' }
            });
        }

        // Notify parties
        // Notify customer if cleaner cancelled
        if (isCleaner) {
            const customerUser = booking.user;
            if (customerUser.phone) {
                await sendSMSNotification(
                    customerUser.id,
                    customerUser.phone,
                    `Your Fixelo booking for ${new Date(booking.scheduledDate).toLocaleDateString()} has been cancelled by the cleaner. Full refund is being processed. We apologize for the inconvenience.`,
                    { bookingId: booking.id, type: 'BOOKING_CANCELLED' }
                );
            }
            await sendEmailNotification(customerUser.id, {
                to: customerUser.email,
                subject: 'Booking Cancelled - Full Refund Issued',
                html: `
                    <h2>Your Booking Has Been Cancelled</h2>
                    <p>Unfortunately, the cleaner had to cancel your booking scheduled for ${new Date(booking.scheduledDate).toLocaleDateString()}.</p>
                    <p>A full refund of <strong>$${refundAmount.toFixed(2)}</strong> is being processed and will appear in your account within 5-10 business days.</p>
                    <p>We apologize for the inconvenience and are working to find you another cleaner.</p>
                `
            }, { bookingId: booking.id, type: 'BOOKING_CANCELLED' });
        }

        // Notify cleaner if customer cancelled
        if (isCustomer && assignedCleaner) {
            const cleanerUser = assignedCleaner.user;
            if (cleanerUser.phone) {
                await sendSMSNotification(
                    cleanerUser.id,
                    cleanerUser.phone,
                    `A booking for ${new Date(booking.scheduledDate).toLocaleDateString()} has been cancelled by the customer.`,
                    { bookingId: booking.id, type: 'BOOKING_CANCELLED' }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            refundAmount,
            cancellationFee,
            refundId
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Please provide a valid cancellation reason' }, { status: 400 });
        }
        console.error('Cancellation error:', error);
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }
}
