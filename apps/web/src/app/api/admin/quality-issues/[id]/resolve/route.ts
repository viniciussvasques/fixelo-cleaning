/**
 * Admin Quality Issue Resolution API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole, QualityIssueStatus, BookingStatus } from '@prisma/client';
import { getStripeClient } from '@/lib/stripe';
import { sendEmailNotification } from '@/lib/email';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { type, details, refundAmount } = await request.json();

        const issue = await prisma.qualityIssue.findUnique({
            where: { id },
        });

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Fetch booking and user separately
        const booking = await prisma.booking.findUnique({
            where: { id: issue.bookingId },
            include: {
                user: true,
                payment: true,
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const reporter = await prisma.user.findUnique({
            where: { id: issue.userId },
        });

        let newStatus: QualityIssueStatus;
        let actualRefundAmount = 0;

        switch (type) {
            case 'RECLEAN':
                newStatus = QualityIssueStatus.RECLEAN_SCHEDULED;
                // Mark booking for re-clean
                await prisma.booking.update({
                    where: { id: issue.bookingId },
                    data: {
                        recleanRequested: true,
                        recleanRequestedAt: new Date(),
                        recleanReason: issue.description,
                    }
                });
                break;

            case 'PARTIAL_REFUND':
            case 'FULL_REFUND':
                newStatus = QualityIssueStatus.REFUNDED;
                actualRefundAmount = type === 'FULL_REFUND' 
                    ? booking.totalPrice 
                    : (refundAmount || booking.totalPrice * 0.3);
                break;

            case 'REJECTED':
                newStatus = QualityIssueStatus.REJECTED;
                break;

            default:
                return NextResponse.json({ error: 'Invalid resolution type' }, { status: 400 });
        }

        // Process refund via Stripe if applicable
        if (actualRefundAmount > 0 && booking.payment?.stripePaymentIntentId) {
            try {
                const stripe = await getStripeClient();
                await stripe.refunds.create({
                    payment_intent: booking.payment.stripePaymentIntentId,
                    amount: Math.round(actualRefundAmount * 100),
                    reason: 'requested_by_customer',
                });

                // Update booking status
                await prisma.booking.update({
                    where: { id: issue.bookingId },
                    data: {
                        status: actualRefundAmount >= booking.totalPrice
                            ? BookingStatus.REFUNDED
                            : BookingStatus.COMPLETED,
                    }
                });
            } catch (stripeError) {
                console.error('[QualityIssue] Stripe refund error:', stripeError);
                return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
            }
        }

        // Update issue
        const updatedIssue = await prisma.qualityIssue.update({
            where: { id },
            data: {
                status: newStatus,
                resolution: type,
                resolutionNotes: details || `Resolved with ${type.replace('_', ' ').toLowerCase()}`,
                resolvedAt: new Date(),
                resolvedBy: session.user.id,
                refundAmount: actualRefundAmount > 0 ? actualRefundAmount : undefined,
            }
        });

        // Notify customer
        if (reporter?.email) {
            let message = '';
            switch (type) {
                case 'RECLEAN':
                    message = `We've approved your re-clean request. We'll contact you shortly to schedule it.`;
                    break;
                case 'PARTIAL_REFUND':
                    message = `We've issued a partial refund of $${actualRefundAmount.toFixed(2)} to your payment method.`;
                    break;
                case 'FULL_REFUND':
                    message = `We've issued a full refund of $${actualRefundAmount.toFixed(2)} to your payment method.`;
                    break;
                case 'REJECTED':
                    message = `After reviewing your complaint, we were unable to approve your request. ${details || 'Please contact support for more details.'}`;
                    break;
            }

            try {
                await sendEmailNotification(reporter.id, {
                    to: reporter.email,
                    subject: `Update on your quality issue report`,
                    html: `
                        <h2>Quality Issue Update</h2>
                        <p>Hi ${reporter.firstName || 'there'},</p>
                        <p>${message}</p>
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <p>Best regards,<br/>Fixelo Support Team</p>
                    `,
                }, { issueId: id, type: 'QUALITY_ISSUE_RESOLVED' });
            } catch (emailError) {
                console.error('[QualityIssue] Failed to send notification:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            issue: updatedIssue,
            refundAmount: actualRefundAmount,
        });

    } catch (error) {
        console.error('[AdminQualityIssue] resolve error:', error);
        return NextResponse.json({ error: 'Failed to resolve issue' }, { status: 500 });
    }
}
