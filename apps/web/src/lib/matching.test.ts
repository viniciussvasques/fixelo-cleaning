import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMatches, calculateScore } from './matching';

// Mock DB
vi.mock('@fixelo/database', () => ({
    prisma: {
        systemConfig: {
            findMany: vi.fn().mockResolvedValue([]) // Returns empty, uses defaults
        },
        cleanerProfile: {
            findMany: vi.fn()
        },
        booking: {
            findUnique: vi.fn()
        }
    }
}));

describe('Matching Algorithm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('calculateScore', () => {
        it('should calculate score correctly for perfect metrics', () => {
            const cleaner = {
                id: 'cleaner1',
                rating: 5.0,
                acceptanceRate: 1.0,
                punctualityRate: 1.0,
            };

            const WEIGHTS = {
                RATING: 0.4,
                DISTANCE: 0.2,
                ACCEPTANCE: 0.2,
                PUNCTUALITY: 0.2
            };

            // Distance 0 means perfect distance score
            const score = calculateScore(cleaner as never, 0, WEIGHTS);

            // Should be close to 1 (perfect score)
            expect(score).toBeGreaterThan(0.9);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('should penalize far distance', () => {
            const cleaner = {
                id: 'cleaner1',
                rating: 5.0,
                acceptanceRate: 1.0,
                punctualityRate: 1.0,
            };

            const WEIGHTS = {
                RATING: 0.4,
                DISTANCE: 0.2,
                ACCEPTANCE: 0.2,
                PUNCTUALITY: 0.2
            };

            // Distance 50km means 0 distance score
            const score = calculateScore(cleaner as never, 50, WEIGHTS);

            // Should be less than perfect (missing 0.2 from distance)
            expect(score).toBeLessThan(0.9);
            expect(score).toBeGreaterThan(0.7);
        });
    });

    describe('findMatches', () => {
        it('should filter out cleaners outside radius', async () => {
            const { prisma } = await import('@fixelo/database');

            // Mock booking with address
            vi.mocked(prisma.booking.findUnique).mockResolvedValue({
                id: 'booking1',
                scheduledDate: new Date('2024-01-01T10:00:00Z'), // Monday
                address: {
                    latitude: 40.7300,
                    longitude: -74.0000
                }
            } as never);

            // Mock cleaners - one within radius, one outside
            vi.mocked(prisma.cleanerProfile.findMany).mockResolvedValue([
                {
                    id: 'cleaner1',
                    status: 'ACTIVE',
                    serviceRadius: 20,
                    latitude: 40.7128,
                    longitude: -74.0060,
                    rating: 5.0,
                    acceptanceRate: 1.0,
                    punctualityRate: 1.0,
                    user: { isActive: true },
                    availability: [{ dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00', isActive: true }]
                },
                {
                    id: 'cleaner2',
                    status: 'ACTIVE',
                    serviceRadius: 0.5, // Too small radius - will be filtered
                    latitude: 40.7128,
                    longitude: -74.0060,
                    rating: 4.5,
                    acceptanceRate: 0.9,
                    punctualityRate: 0.9,
                    user: { isActive: true },
                    availability: [{ dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00', isActive: true }]
                }
            ] as never);

            const matches = await findMatches('booking1');

            // Only cleaner1 should match (cleaner2 has too small radius)
            expect(matches.length).toBe(1);
            expect(matches[0].cleaner.id).toBe('cleaner1');
        });

        it('should throw error for invalid booking', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

            await expect(findMatches('invalid-booking')).rejects.toThrow('Booking not found');
        });

        it('should filter cleaners without matching availability', async () => {
            const { prisma } = await import('@fixelo/database');

            // Monday booking
            vi.mocked(prisma.booking.findUnique).mockResolvedValue({
                id: 'booking1',
                scheduledDate: new Date('2024-01-01T10:00:00Z'), // Monday
                address: {
                    latitude: 40.7300,
                    longitude: -74.0000
                }
            } as never);

            // Cleaner only available on Tuesday
            vi.mocked(prisma.cleanerProfile.findMany).mockResolvedValue([
                {
                    id: 'cleaner1',
                    status: 'ACTIVE',
                    serviceRadius: 20,
                    latitude: 40.7128,
                    longitude: -74.0060,
                    rating: 5.0,
                    acceptanceRate: 1.0,
                    punctualityRate: 1.0,
                    user: { isActive: true },
                    availability: [{ dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '18:00', isActive: true }]
                }
            ] as never);

            const matches = await findMatches('booking1');

            expect(matches.length).toBe(0);
        });
    });
});
