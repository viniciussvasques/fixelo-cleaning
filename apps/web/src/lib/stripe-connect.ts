/**
 * Stripe Connect Transfers
 * 
 * Handles transfers to cleaners after job completion.
 * Uses Stripe Connect with destination charges.
 */

import Stripe from 'stripe';
import { prisma } from '@fixelo/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

interface TransferResult {
    success: boolean;
    transferId?: string;
    error?: string;
}

/**
 * Create a transfer to cleaner's Stripe Connect account
 */
export async function createTransferToCleaner(
    bookingId: string,
    cleanerId: string
): Promise<TransferResult> {
    try {
        // Get booking and cleaner details
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                serviceType: true,
            },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        if (!booking.payment || booking.payment.status !== 'SUCCEEDED') {
            return { success: false, error: 'Payment not completed' };
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { id: cleanerId },
            include: { user: true },
        });

        if (!cleaner) {
            return { success: false, error: 'Cleaner not found' };
        }

        if (!cleaner.stripeAccountId) {
            return { success: false, error: 'Cleaner has no Stripe account' };
        }

        // Get financial settings
        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15; // Default 15%

        // Calculate amounts
        const totalAmount = booking.totalPrice;
        const platformFee = Math.round(totalAmount * platformFeePercent * 100) / 100;
        const cleanerPayout = Math.round((totalAmount - platformFee) * 100); // In cents

        // Create transfer
        const transfer = await stripe.transfers.create({
            amount: cleanerPayout,
            currency: 'usd',
            destination: cleaner.stripeAccountId,
            transfer_group: `booking_${bookingId}`,
            metadata: {
                bookingId,
                cleanerId,
                platformFee: platformFee.toString(),
                totalAmount: totalAmount.toString(),
            },
        });

        // Update booking with payout info
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                payoutStatus: 'COMPLETED',
                payoutId: transfer.id,
            },
        });

        // Create payout record
        await prisma.payout.create({
            data: {
                cleanerId,
                amount: cleanerPayout / 100,
                status: 'COMPLETED',
                stripePayoutId: transfer.id,
                periodStart: new Date(),
                periodEnd: new Date(),
                paidAt: new Date(),
            },
        });

        console.log(`[Transfer] Created transfer ${transfer.id} for $${cleanerPayout / 100} to cleaner ${cleanerId}`);

        return {
            success: true,
            transferId: transfer.id,
        };
    } catch (error) {
        console.error('[Transfer] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Process payout when job is marked as completed
 */
export async function processJobCompletion(bookingId: string): Promise<TransferResult> {
    const assignment = await prisma.cleanerAssignment.findFirst({
        where: {
            bookingId,
            status: 'ACCEPTED',
        },
    });

    if (!assignment) {
        return { success: false, error: 'No accepted assignment found' };
    }

    return createTransferToCleaner(bookingId, assignment.cleanerId);
}
