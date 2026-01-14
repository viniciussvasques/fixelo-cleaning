/**
 * NO_SHOW Detection and Processing
 * 
 * Handles cleaners who don't check in on time:
 * - Mark assignment as NO_SHOW
 * - Penalize cleaner (reduce rating)
 * - Refund customer via Stripe
 * - Release job to other cleaners
 * - Send notifications
 */

import { prisma } from '@fixelo/database';
import { getStripeClient } from './stripe';
import { sendEmailNotification } from './email';

// Configuration defaults (can be overridden by SystemConfig)
const DEFAULT_TOLERANCE_MINUTES = 30;
const DEFAULT_NO_SHOWS_FOR_SUSPENSION = 3;
const DEFAULT_RATING_PENALTY = 0.5;

/**
 * Get NO_SHOW configuration from database
 */
async function getNoShowConfig() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: ['no_show_tolerance_minutes', 'no_show_suspension_count', 'no_show_rating_penalty'] }
        }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));

    return {
        toleranceMinutes: parseInt(configMap.get('no_show_tolerance_minutes') || String(DEFAULT_TOLERANCE_MINUTES)),
        suspensionCount: parseInt(configMap.get('no_show_suspension_count') || String(DEFAULT_NO_SHOWS_FOR_SUSPENSION)),
        ratingPenalty: parseFloat(configMap.get('no_show_rating_penalty') || String(DEFAULT_RATING_PENALTY)),
    };
}

/**
 * Find bookings where cleaner didn't check in
 */
export async function findNoShowBookings() {
    const config = await getNoShowConfig();
    const cutoffTime = new Date(Date.now() - config.toleranceMinutes * 60 * 1000);

    // Find assignments that are ACCEPTED but haven't started (no check-in)
    // and scheduled time + tolerance has passed
    const noShowAssignments = await prisma.cleanerAssignment.findMany({
        where: {
            status: 'ACCEPTED',
            startedAt: null, // No check-in on the assignment
            booking: {
                status: { in: ['ASSIGNED', 'ACCEPTED'] },
                scheduledDate: { lte: cutoffTime },
            }
        },
        include: {
            booking: {
                include: {
                    user: true,
                    address: true,
                    serviceType: true,
                    payment: true,
                }
            },
            cleaner: {
                include: { user: true }
            }
        }
    });

    return noShowAssignments;
}

/**
 * Process a single NO_SHOW assignment
 */
export async function processNoShow(assignmentId: string) {
    const config = await getNoShowConfig();

    const assignment = await prisma.cleanerAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            booking: {
                include: {
                    user: true,
                    address: true,
                    serviceType: true,
                    payment: true,
                }
            },
            cleaner: {
                include: { user: true }
            }
        }
    });

    if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
    }

    const { booking, cleaner } = assignment;

    console.log(`[NO_SHOW] Processing assignment ${assignmentId} for booking ${booking.id}`);

    await prisma.$transaction(async (tx) => {
        // 1. Mark assignment as NO_SHOW
        await tx.cleanerAssignment.update({
            where: { id: assignmentId },
            data: { status: 'NO_SHOW' }
        });

        // 2. Update booking status back to PENDING for reassignment
        await tx.booking.update({
            where: { id: booking.id },
            data: { status: 'PENDING' }
        });

        // 3. Penalize cleaner - reduce rating and increment no-show count
        const currentNoShows = (cleaner.noShowCount || 0) + 1;
        const newRating = Math.max(0, (cleaner.rating || 5) - config.ratingPenalty);
        const shouldSuspend = currentNoShows >= config.suspensionCount;

        await tx.cleanerProfile.update({
            where: { id: cleaner.id },
            data: {
                rating: newRating,
                noShowCount: currentNoShows,
                ...(shouldSuspend ? { status: 'SUSPENDED' } : {})
            }
        });

        console.log(`[NO_SHOW] Cleaner ${cleaner.id} penalized: rating=${newRating}, noShows=${currentNoShows}, suspended=${shouldSuspend}`);
    });

    // 4. Refund customer via Stripe (outside transaction)
    if (booking.payment?.stripePaymentIntentId) {
        try {
            const stripe = await getStripeClient();
            const refund = await stripe.refunds.create({
                payment_intent: booking.payment.stripePaymentIntentId,
                reason: 'requested_by_customer',
                metadata: {
                    reason: 'cleaner_no_show',
                    bookingId: booking.id,
                    cleanerId: cleaner.id,
                }
            });
            console.log(`[NO_SHOW] Refund created: ${refund.id} for booking ${booking.id}`);

            // Update payment record
            await prisma.payment.update({
                where: { id: booking.payment.id },
                data: {
                    status: 'REFUNDED',
                    refundedAt: new Date(),
                    stripeRefundId: refund.id,
                }
            });
        } catch (error) {
            console.error(`[NO_SHOW] Failed to create refund for booking ${booking.id}:`, error);
        }
    }

    // 5. Send email to customer
    try {
        await sendEmailNotification(booking.userId, {
            to: booking.user.email,
            subject: 'We apologize - Your cleaner didn\'t arrive | Fixelo',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">We're Sorry 😔</h1>
                    <p>Hi ${booking.user.firstName || 'there'},</p>
                    <p>Unfortunately, your assigned cleaner didn't arrive for your scheduled cleaning.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>What happens next:</strong>
                        <ul>
                            <li>✅ Full refund has been processed</li>
                            <li>✅ Your job is now available to other cleaners</li>
                            <li>✅ We've taken action against the cleaner</li>
                        </ul>
                    </div>
                    
                    <p>We sincerely apologize for the inconvenience. This is not the experience we want for you.</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Track Your Booking
                        </a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 12px;">
                        © ${new Date().getFullYear()} Fixelo. All rights reserved.
                    </p>
                </div>
            `,
        }, { bookingId: booking.id, type: 'NO_SHOW_APOLOGY' });

        console.log(`[NO_SHOW] Sent apology email to ${booking.user.email}`);
    } catch (error) {
        console.error(`[NO_SHOW] Failed to send apology email:`, error);
    }

    // 6. Notify all active cleaners about the available job
    try {
        const activeCleaners = await prisma.cleanerProfile.findMany({
            where: {
                status: 'ACTIVE',
                id: { not: cleaner.id } // Exclude the no-show cleaner
            },
            include: { user: true }
        });

        if (activeCleaners.length > 0) {
            await prisma.notification.createMany({
                data: activeCleaners.map(c => ({
                    userId: c.userId,
                    type: 'PUSH' as const,
                    status: 'SENT' as const,
                    subject: '🚨 Urgent Job Available!',
                    body: `A ${booking.serviceType?.name || 'cleaning'} job in ${booking.address?.city || 'your area'} needs a cleaner urgently!`,
                    metadata: { bookingId: booking.id, type: 'URGENT_JOB' },
                    sentAt: new Date()
                }))
            });
            console.log(`[NO_SHOW] Notified ${activeCleaners.length} cleaners about urgent job`);
        }
    } catch (error) {
        console.error(`[NO_SHOW] Failed to notify cleaners:`, error);
    }

    return { success: true, bookingId: booking.id, cleanerId: cleaner.id };
}

/**
 * Check all bookings for NO_SHOWs and process them
 */
export async function checkAndProcessNoShows() {
    const noShowAssignments = await findNoShowBookings();

    console.log(`[NO_SHOW] Found ${noShowAssignments.length} potential no-shows`);

    const results = [];
    for (const assignment of noShowAssignments) {
        try {
            const result = await processNoShow(assignment.id);
            results.push(result);
        } catch (error) {
            console.error(`[NO_SHOW] Failed to process assignment ${assignment.id}:`, error);
            results.push({ success: false, assignmentId: assignment.id, error: String(error) });
        }
    }

    return results;
}
