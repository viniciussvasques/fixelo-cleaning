/**
 * Process Payouts API
 * 
 * Manually trigger payout processing
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole, BookingStatus } from '@prisma/client';
import { getStripeClient } from '@/lib/stripe';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;
        const holdDays = settings?.holdDaysAfterService ?? 2;

        // Get eligible bookings
        const eligibleDate = new Date();
        eligibleDate.setDate(eligibleDate.getDate() - holdDays);

        const bookings = await prisma.booking.findMany({
            where: {
                status: BookingStatus.COMPLETED,
                payoutStatus: 'PENDING',
                updatedAt: { lte: eligibleDate }, // Use updatedAt as proxy for completion date
                recleanRequested: false,
            },
            include: {
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: true }
                }
            }
        });

        const stripe = await getStripeClient();
        let processed = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const booking of bookings) {
            const assignment = booking.assignments[0];
            if (!assignment?.cleaner?.stripeAccountId) {
                errors.push(`Booking ${booking.id}: No Stripe account`);
                continue;
            }

            const cleaner = assignment.cleaner;
            const stripeAccountId = cleaner.stripeAccountId as string; // Already validated above
            const totalPrice = booking.totalPrice;
            const stripeFee = totalPrice * 0.029 + 0.30;
            const netAfterStripe = totalPrice - stripeFee;
            const cleanerPayout = Math.round(netAfterStripe * (1 - platformFeePercent - insuranceFeePercent) * 100); // cents

            try {
                // Create transfer
                await stripe.transfers.create({
                    amount: cleanerPayout,
                    currency: 'usd',
                    destination: stripeAccountId,
                    metadata: {
                        bookingId: booking.id,
                        cleanerId: cleaner.id,
                    }
                });

                // Update booking
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                        payoutStatus: 'PAID',
                    }
                });

                processed++;
            } catch (err) {
                failed++;
                errors.push(`Booking ${booking.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                console.error(`[Payout] Failed for booking ${booking.id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            processed,
            failed,
            errors: errors.slice(0, 10), // Limit errors returned
            message: `Processed ${processed} payouts, ${failed} failed`,
        });

    } catch (error) {
        console.error('[ProcessPayouts] error:', error);
        return NextResponse.json({ error: 'Failed to process payouts' }, { status: 500 });
    }
}
