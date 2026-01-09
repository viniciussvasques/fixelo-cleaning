import { prisma } from "@fixelo/database";

export async function updateCleanerMetrics(cleanerId: string) {
    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { id: cleanerId },
        include: {
            assignments: true,
            reviews: true
        }
    });

    if (!cleaner) return;

    // 1. Calculate Acceptance Rate (Accepted / Offered)
    // Note: 'Offered' is tracked incrementally via notifications/invites
    const acceptedCount = cleaner.assignments.filter(a => a.status === 'ACCEPTED').length;
    const acceptanceRate = cleaner.totalJobsOffered > 0
        ? acceptedCount / cleaner.totalJobsOffered
        : 1; // Default to 100% if new

    // 2. Calculate Completion Rate (Completed / Accepted)
    // Assuming 'COMPLETED' status exists on Booking or Assignment tracking
    // For now we use the counter 'totalJobsCompleted' which we will increment manually
    const completionRate = acceptedCount > 0
        ? cleaner.totalJobsCompleted / acceptedCount
        : 1;

    // 3. Quality Score (Average Rating)
    const totalRating = cleaner.reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = cleaner.reviews.length > 0
        ? totalRating / cleaner.reviews.length
        : 5; // Default 5 stars

    // 4. Update Profile
    await prisma.cleanerProfile.update({
        where: { id: cleanerId },
        data: {
            acceptanceRate,
            completionRate,
            qualityScore: averageRating, // Simple average for now
            rating: averageRating,
            totalRatings: cleaner.reviews.length,
            // totalJobsAccepted: acceptedCount // Sync this count
        }
    });
}
