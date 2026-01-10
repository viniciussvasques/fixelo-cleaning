import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, paymentId, amount, reason } = await req.json();

        if (!bookingId || !amount || !reason) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Get the payment record
        const payment = await prisma.payment.findFirst({
            where: {
                bookingId,
                status: 'SUCCEEDED'
            },
            include: { booking: true }
        });

        if (!payment) {
            return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
        }

        if (!payment.stripePaymentIntentId) {
            return NextResponse.json({ message: 'No Stripe payment intent found' }, { status: 400 });
        }

        // Validate amount
        if (amount > payment.amount) {
            return NextResponse.json({ message: 'Refund amount exceeds payment amount' }, { status: 400 });
        }

        // Process refund via Stripe
        const stripeClient = await getStripeClient();
        const refund = await stripeClient.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
                bookingId,
                adminUserId: (session.user as any).id,
                internalReason: reason,
            }
        });

        // Update payment status
        const isFullRefund = amount >= payment.amount;
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            }
        });

        // Update booking status
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'REFUNDED',
                cancellationReason: reason,
                cancelledAt: new Date(),
                cancelledBy: (session.user as any).id,
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                entity: 'Booking',
                entityId: bookingId,
                action: isFullRefund ? 'FULL_REFUND' : 'PARTIAL_REFUND',
                userId: (session.user as any).id,
                metadata: {
                    amount,
                    reason,
                    stripeRefundId: refund.id,
                },
            }
        });

        console.log(`[Refund] Processed ${isFullRefund ? 'full' : 'partial'} refund of $${amount} for booking ${bookingId}`);

        return NextResponse.json({
            success: true,
            refundId: refund.id,
            amount: amount,
        });
    } catch (error: any) {
        console.error('Refund error:', error);

        // Handle Stripe-specific errors
        if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'Failed to process refund' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get recent refunded bookings
        const refundedBookings = await prisma.booking.findMany({
            where: { status: 'REFUNDED' },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                serviceType: { select: { name: true } },
            },
            orderBy: { cancelledAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(refundedBookings);
    } catch (error) {
        console.error('Get refunds error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
