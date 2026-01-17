import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@fixelo/database', () => ({
    prisma: {
        systemConfig: {
            findUnique: vi.fn(),
        },
    },
}));

describe('Stripe Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.STRIPE_SECRET_KEY;
        delete process.env.STRIPE_WEBHOOK_SECRET;
    });

    describe('clearStripeCache', () => {
        it('should clear cached stripe instance without throwing', async () => {
            const { clearStripeCache } = await import('./stripe');
            expect(() => clearStripeCache()).not.toThrow();
        });

        it('should be callable multiple times', async () => {
            const { clearStripeCache } = await import('./stripe');
            clearStripeCache();
            clearStripeCache();
            clearStripeCache();
            expect(true).toBe(true);
        });
    });

    describe('getStripeWebhookSecret', () => {
        it('should get webhook secret from database', async () => {
            const { prisma } = await import('@fixelo/database');
            const mockConfig = {
                id: '2',
                key: 'stripe_webhook_secret',
                value: 'whsec_from_db',
                description: null,
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(mockConfig);

            const { getStripeWebhookSecret } = await import('./stripe');
            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_db');
        });

        it('should fallback to env variable when db returns null', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_from_env';

            const { getStripeWebhookSecret, clearStripeCache } = await import('./stripe');
            clearStripeCache();
            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_env');
        });

        it('should throw error when no secret available', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            delete process.env.STRIPE_WEBHOOK_SECRET;

            const { getStripeWebhookSecret, clearStripeCache } = await import('./stripe');
            clearStripeCache();

            await expect(getStripeWebhookSecret()).rejects.toThrow('STRIPE_WEBHOOK_SECRET not configured');
        });
    });
});
