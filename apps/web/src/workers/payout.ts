import cron from 'node-cron';
import { prisma } from '@fixelo/database';
import { stripe } from '@/lib/stripe';
import { CleanerProfile } from '@prisma/client';

interface CleanerPayoutData {
    cleaner: CleanerProfile;
    amount: number;
    bookings: string[];
}

// Cron schedule - run every Friday at 9:00 AM
const PAYOUT_CRON_SCHEDULE = '0 9 * * 5';

console.log(`🚀 Payout Worker Started. Schedule: ${PAYOUT_CRON_SCHEDULE}`);

// Main Job
cron.schedule(PAYOUT_CRON_SCHEDULE, async () => {
    console.log(`[${new Date().toISOString()}] Starting Weekly Payout Process...`);
    await processWeeklyPayouts();
});

async function processWeeklyPayouts() {
    try {
        // 0. Load Financial Settings from DB
        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;
        const minPayoutAmount = settings?.minPayoutAmount ?? 50;

        console.log(`[Payout] Using settings: Platform ${platformFeePercent * 100}%, Insurance ${insuranceFeePercent * 100}%, Min $${minPayoutAmount}`);

        // 1. Fetch completed bookings pending payout
        const bookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                payoutStatus: 'PENDING',
            },
            include: {
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: true }
                }
            }
        });

        if (bookings.length === 0) {
            console.log('No eligible bookings found for payout.');
            return;
        }

        console.log(`Found ${bookings.length} eligible bookings.`);

        // 2. Group by Cleaner
        const payoutsByCleaner = new Map<string, CleanerPayoutData>();

        for (const booking of bookings) {
            // Find the accepted cleaner (should be only one)
            const acceptedAssignment = booking.assignments[0];

            if (!acceptedAssignment || !acceptedAssignment.cleaner || !acceptedAssignment.cleaner.stripeAccountId) {
                console.warn(`Booking ${booking.id} skipped: No accepted cleaner or Stripe Account linked.`);
                continue;
            }

            const cleaner = acceptedAssignment.cleaner;
            const cleanerId = cleaner.id;

            const current = payoutsByCleaner.get(cleanerId) || {
                cleaner: cleaner,
                amount: 0,
                bookings: []
            };

            // Calculate Net Amount using DB settings
            const netAmount = booking.totalPrice * (1 - (platformFeePercent + insuranceFeePercent));

            current.amount += netAmount;
            current.bookings.push(booking.id);
            payoutsByCleaner.set(cleanerId, current);
        }

        // 3. Process Transfers
        for (const [cleanerId, data] of payoutsByCleaner) {
            if (data.amount < minPayoutAmount) {
                console.log(`Skipping Cleaner ${cleanerId}: Below minimum ($${data.amount.toFixed(2)} < $${minPayoutAmount})`);
                continue;
            }

            try {
                console.log(`Processing payout for ${data.cleaner.userId} ($${data.amount.toFixed(2)})...`);

                // Create Transfer
                const transfer = await stripe.transfers.create({
                    amount: Math.round(data.amount * 100), // cents
                    currency: 'usd',
                    destination: data.cleaner.stripeAccountId!,
                    description: `Weekly Payout for ${data.bookings.length} jobs`,
                    metadata: {
                        cleanerId: cleanerId
                    }
                });

                // Record Payout in DB
                const payoutRecord = await prisma.payout.create({
                    data: {
                        cleanerId: cleanerId,
                        amount: data.amount,
                        status: 'PAID',
                        stripePayoutId: transfer.id,
                        periodStart: new Date(),
                        periodEnd: new Date(),
                    }
                });

                // Update Bookings
                await prisma.booking.updateMany({
                    where: { id: { in: data.bookings } },
                    data: {
                        payoutStatus: 'PAID',
                        payoutId: payoutRecord.id
                    }
                });

                console.log(`✅ Success: Payout ${payoutRecord.id} created.`);

            } catch (err) {
                console.error(`❌ Failed payout for ${cleanerId}:`, err);
            }
        }

    } catch (error) {
        console.error('Critical Error in Payout Process:', error);
    }
}

// Keep process alive
process.stdin.resume();
