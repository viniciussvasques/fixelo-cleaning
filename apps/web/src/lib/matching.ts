import { prisma } from '@fixelo/database';
import { Prisma, CleanerProfile } from '@prisma/client';

// Default weights (used as fallback if not configured in DB)
const DEFAULT_WEIGHTS = {
    RATING: 0.4,
    DISTANCE: 0.2,
    ACCEPTANCE: 0.2,
    PUNCTUALITY: 0.2
};

// Fetch weights from SystemConfig table
async function getAlgorithmWeights() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: ['match_weight_rating', 'match_weight_distance', 'match_weight_acceptance', 'match_weight_punctuality'] }
        }
    });

    const configMap = new Map(configs.map(c => [c.key, parseFloat(c.value)]));

    return {
        RATING: configMap.get('match_weight_rating') ?? DEFAULT_WEIGHTS.RATING,
        DISTANCE: configMap.get('match_weight_distance') ?? DEFAULT_WEIGHTS.DISTANCE,
        ACCEPTANCE: configMap.get('match_weight_acceptance') ?? DEFAULT_WEIGHTS.ACCEPTANCE,
        PUNCTUALITY: configMap.get('match_weight_punctuality') ?? DEFAULT_WEIGHTS.PUNCTUALITY,
    };
}

type CleanerWithAvailability = Prisma.CleanerProfileGetPayload<{
    include: { availability: true, user: true }
}>;

interface ScoredCleaner {
    cleaner: CleanerWithAvailability;
    score: number;
    distance: number;
}

export async function findMatches(bookingId: string): Promise<ScoredCleaner[]> {
    // Load weights from DB
    const WEIGHTS = await getAlgorithmWeights();

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { address: true }
    });

    if (!booking || !booking.address) {
        throw new Error('Booking not found or missing address');
    }

    // 1. Filter: Active Cleaners
    // In a real app, we also filter by "Is not blocked", "Has Service Type skill", etc.
    const allCleaners = await prisma.cleanerProfile.findMany({
        where: {
            status: 'ACTIVE',
            user: { isActive: true },
            // Add availability check here or post-process?
            // For MVP, we'll post-process availability to keep query simple, or check DayOfWeek matches
        },
        include: {
            user: true,
            availability: true
        }
    });

    const matches: ScoredCleaner[] = [];

    const bookingDayOfWeek = getDayOfWeek(booking.scheduledDate);
    // const bookingTime = ... (unused right now)

    for (const cleaner of allCleaners) {
        // A. Availability Check
        // Explicitly cast to any for availability access if intersection type fails, or use proper Payload type
        const availability = cleaner.availability;
        if (!availability) continue;

        const isAvailable = availability.some((slot) =>
            slot.dayOfWeek === bookingDayOfWeek &&
            slot.isActive
        );

        if (!isAvailable) continue;

        // B. Radius Check (Haversine Distance)
        if (!cleaner.latitude || !cleaner.longitude || !booking.address.latitude || !booking.address.longitude) continue;

        const distance = calculateDistance(
            booking.address.latitude, booking.address.longitude,
            cleaner.latitude, cleaner.longitude
        );

        if (distance > cleaner.serviceRadius) continue;

        // C. Scoring (pass weights to scoring function)
        const score = calculateScore(cleaner, distance, WEIGHTS);
        matches.push({ cleaner, score, distance });
    }

    // Sort by Score DESC
    return matches.sort((a, b) => b.score - a.score);
}

interface AlgorithmWeights {
    RATING: number;
    DISTANCE: number;
    ACCEPTANCE: number;
    PUNCTUALITY: number;
}

export function calculateScore(cleaner: CleanerProfile, distance: number, WEIGHTS: AlgorithmWeights): number {
    // Normalize metrics to 0-1 scale

    // Rating (0-5) -> 0-1
    const normRating = (cleaner.rating || 0) / 5;

    // Distance: closer is better. 
    // Let's assume max reasonable distance is 50km. 
    // If distance is 0, score 1. If 50, score 0.
    const maxDist = 50;
    const normDistance = Math.max(0, (maxDist - distance) / maxDist);

    // Acceptance Rate (0-1 directly? or 0-100? Schema says Float 0-1)
    const normAcceptance = cleaner.acceptanceRate || 0;

    // Punctuality (0-1)
    const normPunctuality = cleaner.punctualityRate || 0;

    const totalScore =
        (normRating * WEIGHTS.RATING) +
        (normDistance * WEIGHTS.DISTANCE) +
        (normAcceptance * WEIGHTS.ACCEPTANCE) +
        (normPunctuality * WEIGHTS.PUNCTUALITY);

    return totalScore;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
}
