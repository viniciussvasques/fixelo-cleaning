import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearStripeCache } from './stripe';

// Mock the database
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
        clearStripeCache();
    });

    describe('clearStripeCache', () => {
        it('should clear cached stripe instance without throwing', () => {
            expect(() => clearStripeCache()).not.toThrow();
        });

        it('should be callable multiple times', () => {
            clearStripeCache();
            clearStripeCache();
            clearStripeCache();
            expect(true).toBe(true);
        });
    });

    describe('getStripeWebhookSecret', () => {
        it('should get webhook secret from database', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
                id: '2',
                key: 'stripe_webhook_secret',
                value: 'whsec_from_db',
                description: null,
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const { getStripeWebhookSecret } = await import('./stripe');
            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_db');
        });

        it('should fallback to env variable when db returns null', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_from_env';

            const { getStripeWebhookSecret } = await import('./stripe');
            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_env');
        });

        it('should throw error when no secret available', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            delete process.env.STRIPE_WEBHOOK_SECRET;

            const { getStripeWebhookSecret } = await import('./stripe');

            await expect(getStripeWebhookSecret()).rejects.toThrow('STRIPE_WEBHOOK_SECRET not configured');
        });
    });
});
