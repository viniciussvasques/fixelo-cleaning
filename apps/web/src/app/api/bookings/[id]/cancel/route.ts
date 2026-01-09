import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, BookingStatus } from '@fixelo/database';
import { z } from 'zod';
import { sendEmailNotification } from '@/lib/email';
import { sendSMSNotification } from '@/lib/sms';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const cancelSchema = z.object({
    reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)'),
});

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = cancelSchema.parse(body);

        // Get booking with assignments and payment info
        const booking = await prisma.booking.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            },
            include: {
                user: true,
                assignments: {
                    include: {
                        cleaner: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                payment: true
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Check if can cancel
        if (booking.status === BookingStatus.COMPLETED) {
            return NextResponse.json(
                { error: 'Cannot cancel completed booking' },
                { status: 400 }
            );
        }

        if (booking.status === BookingStatus.CANCELLED) {
            return NextResponse.json(
                { error: 'Booking already cancelled' },
                { status: 400 }
            );
        }

        // Cancel booking
        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: {
                status: BookingStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: session.user.id,
                cancellationReason: reason
            }
        });

        // Notify assigned cleaner if any
        const activeAssignment = booking.assignments.find(
            a => a.status === 'ACCEPTED' || a.status === 'PENDING'
        );

        if (activeAssignment?.cleaner) {
            const cleanerUser = activeAssignment.cleaner.user;

            // Send email notification to cleaner
            await sendEmailNotification(cleanerUser.id, {
                to: cleanerUser.email,
                subject: 'Booking Cancellation Notice - Fixelo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #dc2626;">Booking Cancelled</h1>
                        <p>Hi ${cleanerUser.firstName},</p>
                        <p>Unfortunately, a booking has been cancelled by the customer.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    ${new Date(booking.scheduledDate).toLocaleDateString()}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Address:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${(booking.addressSnapshot as { street?: string })?.street || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${reason}</td>
                            </tr>
                        </table>
                        <p>This time slot is now available for other bookings. Check your dashboard for new job offers!</p>
                        <p>Best regards,<br/>The Fixelo Team</p>
                    </div>
                `,
            });

            // Send SMS notification if phone available
            if (cleanerUser.phone) {
                await sendSMSNotification(
                    cleanerUser.id,
                    cleanerUser.phone,
                    `Fixelo: A booking for ${new Date(booking.scheduledDate).toLocaleDateString()} has been cancelled. Check your dashboard for new jobs.`
                );
            }

            // Update assignment status
            await prisma.cleanerAssignment.update({
                where: { id: activeAssignment.id },
                data: { status: 'CANCELLED' }
            });
        }

        // Process refund if paid
        if (booking.payment?.stripePaymentIntentId && booking.payment.status === 'SUCCEEDED') {
            try {
                // Create refund via Stripe
                const refund = await stripe.refunds.create({
                    payment_intent: booking.payment.stripePaymentIntentId,
                    reason: 'requested_by_customer',
                });

                // Update payment record
                await prisma.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: 'REFUNDED',
                        stripeRefundId: refund.id,
                        refundedAmount: refund.amount / 100,
                        refundedAt: new Date(),
                    }
                });

                // Send refund confirmation to customer
                await sendEmailNotification(booking.user.id, {
                    to: booking.user.email,
                    subject: 'Your Refund Has Been Processed - Fixelo',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #2563eb;">Refund Processed</h1>
                            <p>Hi ${booking.user.firstName},</p>
                            <p>Your booking cancellation has been processed and a refund of 
                               <strong>$${(refund.amount / 100).toFixed(2)}</strong> has been initiated.</p>
                            <p>The refund should appear in your account within 5-10 business days, 
                               depending on your bank or card issuer.</p>
                            <p>We're sorry to see you go. If you'd like to book again in the future, 
                               we'll be here!</p>
                            <p>Best regards,<br/>The Fixelo Team</p>
                        </div>
                    `,
                });

            } catch (refundError) {
                console.error('Refund processing error:', refundError);
                // Don't fail the cancellation, but log the error
            }
        }

        return NextResponse.json({
            ...updatedBooking,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Booking cancellation error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel booking' },
            { status: 500 }
        );
    }
}
