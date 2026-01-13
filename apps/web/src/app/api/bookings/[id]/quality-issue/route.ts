/**
 * Quality Issue / Guarantee API
 * 
 * Allows customers to report quality issues and request:
 * - Re-clean (free)
 * - Partial refund
 * - Full refund (if rating <= 2)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';
import { sendSMSNotification } from '@/lib/sms';
import { sendEmailNotification } from '@/lib/email';

const issueSchema = z.object({
    issueType: z.enum(['INCOMPLETE', 'DAMAGE', 'NO_SHOW', 'POOR_QUALITY', 'OTHER']),
    description: z.string().min(20).max(2000),
    photos: z.array(z.string().url()).optional(),
    requestType: z.enum(['RECLEAN', 'PARTIAL_REFUND', 'FULL_REFUND']),
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
        const data = issueSchema.parse(body);

        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                user: true,
                payment: true,
                review: true,
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

        // Verify ownership
        if (booking.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Verify booking is completed
        if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Can only report issues for completed bookings' }, { status: 400 });
        }

        // Check time window
        const settings = await prisma.financialSettings.findFirst();
        const recleanWindowHours = settings?.recleanWindowHours ?? 48;
        const autoRefundThreshold = settings?.autoRefundThreshold ?? 2;

        const completedAt = booking.assignments[0]?.completedAt || booking.updatedAt;
        const hoursSinceCompletion = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60);

        if (hoursSinceCompletion > recleanWindowHours) {
            return NextResponse.json({
                error: `Quality issues must be reported within ${recleanWindowHours} hours of service completion`
            }, { status: 400 });
        }

        // Check if issue already exists
        const existingIssue = await prisma.qualityIssue.findFirst({
            where: {
                bookingId: booking.id,
                status: { in: ['OPEN', 'RECLEAN_SCHEDULED'] }
            }
        });

        if (existingIssue) {
            return NextResponse.json({ error: 'An open issue already exists for this booking' }, { status: 400 });
        }

        const cleaner = booking.assignments[0]?.cleaner;
        if (!cleaner) {
            return NextResponse.json({ error: 'No cleaner assigned' }, { status: 400 });
        }

        // Determine resolution based on request type and conditions
        let resolution = data.requestType;
        let refundAmount: number | null = null;
        let creditAmount: number | null = null;
        let autoProcess = false;

        // Auto-approve full refund if rating was <= threshold
        if (booking.review && booking.review.rating <= autoRefundThreshold) {
            autoProcess = true;
            resolution = 'FULL_REFUND';
            refundAmount = booking.totalPrice;
        } else if (data.issueType === 'NO_SHOW') {
            // Auto full refund for no-shows
            autoProcess = true;
            resolution = 'FULL_REFUND';
            refundAmount = booking.totalPrice;
        } else if (data.requestType === 'PARTIAL_REFUND') {
            // Partial refunds start at 30% and get reviewed
            refundAmount = booking.totalPrice * 0.3;
        } else if (data.requestType === 'FULL_REFUND') {
            refundAmount = booking.totalPrice;
        }

        // Create quality issue record
        const issue = await prisma.qualityIssue.create({
            data: {
                bookingId: booking.id,
                userId: session.user.id,
                cleanerId: cleaner.id,
                issueType: data.issueType,
                description: data.description,
                photos: data.photos ? JSON.stringify(data.photos) : null,
                status: autoProcess ? 'REFUNDED' : 'OPEN',
                resolution: resolution === 'RECLEAN' ? 'RECLEAN' : (refundAmount ? 'PARTIAL_REFUND' : null),
                refundAmount: autoProcess ? refundAmount : null
            }
        });

        // Process automatic refund if applicable
        if (autoProcess && refundAmount && booking.payment?.stripePaymentIntentId) {
            try {
                const stripe = await getStripeClient();
                await stripe.refunds.create({
                    payment_intent: booking.payment.stripePaymentIntentId,
                    amount: Math.round(refundAmount * 100),
                    reason: 'requested_by_customer',
                    metadata: {
                        bookingId: booking.id,
                        qualityIssueId: issue.id,
                        issueType: data.issueType
                    }
                });

                // Update booking
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                        qualityIssueRefunded: true,
                        refundReason: data.issueType
                    }
                });

                // Update payment
                await prisma.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: 'REFUNDED',
                        refundedAmount: refundAmount,
                        refundedAt: new Date()
                    }
                });

            } catch (err) {
                console.error('Auto refund failed:', err);
            }
        }

        // Mark booking for re-clean if requested
        if (data.requestType === 'RECLEAN') {
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    recleanRequested: true,
                    recleanRequestedAt: new Date(),
                    recleanReason: data.description
                }
            });
        }

        // Notify admin
        await sendEmailNotification('admin', {
            to: 'support@fixelo.app',
            subject: `Quality Issue Reported - Booking ${booking.id}`,
            html: `
                <h2>New Quality Issue</h2>
                <p><strong>Type:</strong> ${data.issueType}</p>
                <p><strong>Request:</strong> ${data.requestType}</p>
                <p><strong>Customer:</strong> ${booking.user.email}</p>
                <p><strong>Cleaner:</strong> ${cleaner.user.email}</p>
                <p><strong>Description:</strong></p>
                <p>${data.description}</p>
                ${autoProcess ? '<p><strong>⚡ Auto-processed: Refund issued</strong></p>' : '<p>⏳ Awaiting review</p>'}
            `
        }, { bookingId: booking.id, type: 'QUALITY_ISSUE' });

        // Notify customer
        const responseMessage = autoProcess
            ? `Your refund of $${refundAmount?.toFixed(2)} has been processed and will appear in your account within 5-10 business days.`
            : data.requestType === 'RECLEAN'
                ? 'Your re-clean request has been submitted. We will contact you within 24 hours to schedule.'
                : 'Your issue has been submitted for review. Our team will respond within 24 hours.';

        if (booking.user.phone) {
            await sendSMSNotification(
                booking.userId,
                booking.user.phone,
                `Fixelo: ${responseMessage}`,
                { bookingId: booking.id, type: 'QUALITY_ISSUE' }
            );
        }

        return NextResponse.json({
            success: true,
            issue,
            autoProcessed: autoProcess,
            refundAmount: autoProcess ? refundAmount : null,
            message: responseMessage
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        console.error('Quality issue error:', error);
        return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 });
    }
}

// Get quality issue status for a booking
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const issues = await prisma.qualityIssue.findMany({
            where: { bookingId: params.id },
            orderBy: { createdAt: 'desc' }
        });

        // Get booking to check ownership
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            select: { userId: true, status: true, recleanRequested: true, updatedAt: true }
        });

        if (!booking || booking.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if can still report
        const settings = await prisma.financialSettings.findFirst();
        const recleanWindowHours = settings?.recleanWindowHours ?? 48;
        const hoursSinceCompletion = (Date.now() - new Date(booking.updatedAt).getTime()) / (1000 * 60 * 60);

        return NextResponse.json({
            issues,
            canReport: booking.status === 'COMPLETED' && hoursSinceCompletion <= recleanWindowHours && !booking.recleanRequested,
            hoursRemaining: Math.max(0, recleanWindowHours - hoursSinceCompletion)
        });

    } catch (error) {
        console.error('Get quality issues error:', error);
        return NextResponse.json({ error: 'Failed to get issues' }, { status: 500 });
    }
}
