import cron from 'node-cron';
import { prisma } from '@fixelo/database';
import { getStripeClient } from '@/lib/stripe';
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
        // Get Stripe client dynamically
        const stripe = await getStripeClient();
        
        // 0. Load Financial Settings from DB
        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;
        const stripeFeePercent = settings?.stripeFeePercent ?? 0.029;
        const stripeFeeFixed = settings?.stripeFeeFixed ?? 0.30;
        const minPayoutAmount = settings?.minPayoutAmount ?? 50;
        const holdDaysAfterService = settings?.holdDaysAfterService ?? 2;

        console.log(`[Payout] Using settings: Platform ${platformFeePercent * 100}%, Insurance ${insuranceFeePercent * 100}%, Hold ${holdDaysAfterService} days, Min $${minPayoutAmount}`);

        // Calculate cutoff date (only pay bookings completed > holdDays ago)
        const holdCutoffDate = new Date();
        holdCutoffDate.setDate(holdCutoffDate.getDate() - holdDaysAfterService);
        console.log(`[Payout] Only processing bookings completed before ${holdCutoffDate.toISOString()}`);

        // 1. Fetch completed bookings pending payout that are past hold period
        const bookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                payoutStatus: 'PENDING',
                // Only include bookings completed before the hold cutoff
                updatedAt: { lt: holdCutoffDate },
                // Exclude bookings with pending quality issues
                recleanRequested: false,
                qualityIssueRefunded: false,
            },
            include: {
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: true }
                }
            }
        });

        if (bookings.length === 0) {
            console.log('No eligible bookings found for payout (considering hold period).');
            return;
        }

        console.log(`Found ${bookings.length} eligible bookings (past ${holdDaysAfterService}-day hold).`);

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

            // Calculate Net Amount: Total - Stripe Fee, then deduct platform + insurance
            const stripeFee = (booking.totalPrice * stripeFeePercent) + stripeFeeFixed;
            const afterStripe = booking.totalPrice - stripeFee;
            const netAmount = afterStripe * (1 - platformFeePercent - insuranceFeePercent);

            // Add tips (100% goes to cleaner)
            const tipAmount = (booking as any).tipAmount || 0;

            current.amount += netAmount + tipAmount;
            current.bookings.push(booking.id);
            payoutsByCleaner.set(cleanerId, current);

            if (tipAmount > 0) {
                console.log(`[Payout] Booking ${booking.id}: Service $${netAmount.toFixed(2)} + Tip $${tipAmount.toFixed(2)}`);
            }
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
