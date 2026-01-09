/**
 * Assignment Expiration Worker
 * 
 * Runs periodically to expire stale assignments and re-assign jobs.
 * Can be run via: npx ts-node src/workers/assignment-expiration.ts
 */

import { prisma } from '@fixelo/database';
import { findMatches } from '../lib/matching';

async function expireStaleAssignments() {
    console.log('[AssignmentExpiration] Starting...');

    const now = new Date();

    try {
        // Find PENDING assignments past their expiry time
        const staleAssignments = await prisma.cleanerAssignment.findMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: now },
            },
            include: {
                booking: true,
                cleaner: true,
            },
        });

        console.log(`[AssignmentExpiration] Found ${staleAssignments.length} expired assignments`);

        for (const assignment of staleAssignments) {
            // Mark as EXPIRED
            await prisma.cleanerAssignment.update({
                where: { id: assignment.id },
                data: {
                    status: 'EXPIRED',
                },
            });

            // Penalize cleaner metrics for not responding
            await prisma.cleanerProfile.update({
                where: { id: assignment.cleanerId },
                data: {
                    acceptanceRate: { decrement: 0.02 },
                },
            });

            // Find next cleaner
            try {
                const candidates = await findMatches(assignment.bookingId);
                const existingAssignments = await prisma.cleanerAssignment.findMany({
                    where: { bookingId: assignment.bookingId },
                    select: { cleanerId: true },
                });
                const excludeSet = new Set(existingAssignments.map(e => e.cleanerId));

                const nextCleaner = candidates.find(c => !excludeSet.has(c.cleaner.id));

                if (nextCleaner) {
                    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min window

                    await prisma.cleanerAssignment.create({
                        data: {
                            bookingId: assignment.bookingId,
                            cleanerId: nextCleaner.cleaner.id,
                            status: 'PENDING',
                            expiresAt,
                            matchScore: nextCleaner.score,
                        },
                    });
                    console.log(`[AssignmentExpiration] Re-assigned to cleaner ${nextCleaner.cleaner.id}`);
                } else {
                    console.log(`[AssignmentExpiration] No cleaners available for booking ${assignment.bookingId}`);
                }
            } catch (matchError) {
                console.error(`[AssignmentExpiration] Match error:`, matchError);
            }
        }

        console.log('[AssignmentExpiration] Done');
    } catch (error) {
        console.error('[AssignmentExpiration] Error:', error);
        throw error;
    }
}

if (require.main === module) {
    expireStaleAssignments()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { expireStaleAssignments };
