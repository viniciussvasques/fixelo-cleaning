import { describe, it, expect, vi } from 'vitest';
import { updateCleanerMetrics } from './metrics';
import { prisma } from '@fixelo/database';
import type { CleanerProfile } from '@prisma/client';

vi.mock('@fixelo/database', () => ({
    prisma: {
        cleanerProfile: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}));

describe('Metrics Calculation', () => {
    it('should calculate acceptance, completion, and quality scores correctly', async () => {
        // Setup mock data
        vi.mocked(prisma.cleanerProfile.findUnique).mockResolvedValue({
            id: 'cleaner1',
            totalJobsOffered: 10,
            totalJobsCompleted: 8,
            assignments: [
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' },
                { status: 'ACCEPTED' }, // 9 accepted out of 10 offered?
                { status: 'ACCEPTED' }, // 8 completed?
                { status: 'REJECTED' }
            ].fill({ status: 'ACCEPTED' }, 0, 9), // 9 accepted
            reviews: [
                { rating: 5 },
                { rating: 4 },
                { rating: 5 },
                { rating: 5 } // Avg: 4.75
            ]
        } as unknown as CleanerProfile);

        // 9 Accepted / 10 Offered = 0.9 Acceptance
        // 8 Completed / 9 Accepted = 0.88 Completion
        // (5+4+5+5)/4 = 4.75 Quality

        await updateCleanerMetrics('cleaner1');

        expect(prisma.cleanerProfile.update).toHaveBeenCalledWith({
            where: { id: 'cleaner1' },
            data: expect.objectContaining({
                acceptanceRate: expect.any(Number),
                completionRate: expect.any(Number),
                qualityScore: expect.any(Number),
                rating: expect.any(Number)
            })
        });
    });
});
