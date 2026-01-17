import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearStripeCache, getStripeClient, getStripeWebhookSecret } from './stripe';

// Mock the database
vi.mock('@fixelo/database', () => ({
    prisma: {
        systemConfig: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock Stripe module
vi.mock('stripe', () => {
    const MockStripe = vi.fn(() => ({
        customers: {
            create: vi.fn(),
            retrieve: vi.fn(),
        },
        paymentIntents: {
            create: vi.fn(),
        },
    }));
    return { default: MockStripe };
});

describe('Stripe Library', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        clearStripeCache();
        // Clear env vars
        delete process.env.STRIPE_SECRET_KEY;
        delete process.env.STRIPE_WEBHOOK_SECRET;
    });

    describe('getStripeClient', () => {
        it('should get stripe client from database config', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
                id: '1',
                key: 'stripe_secret_key',
                value: 'sk_test_from_db',
                description: null,
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const client = await getStripeClient();

            expect(client).toBeDefined();
            expect(prisma.systemConfig.findUnique).toHaveBeenCalled();
        });

        it('should fallback to env variable when db fails', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockRejectedValue(new Error('DB Error'));
            process.env.STRIPE_SECRET_KEY = 'sk_test_from_env';
            clearStripeCache();

            const client = await getStripeClient();

            expect(client).toBeDefined();
        });

        it('should cache stripe instance', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
                id: '1',
                key: 'stripe_secret_key',
                value: 'sk_test_cached',
                description: null,
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            clearStripeCache();

            const client1 = await getStripeClient();
            const client2 = await getStripeClient();

            expect(client1).toBe(client2);
        });

        it('should throw error when no key available', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            delete process.env.STRIPE_SECRET_KEY;
            clearStripeCache();

            await expect(getStripeClient()).rejects.toThrow('STRIPE_SECRET_KEY not configured');
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

            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_db');
        });

        it('should fallback to env variable', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_from_env';

            const secret = await getStripeWebhookSecret();

            expect(secret).toBe('whsec_from_env');
        });

        it('should throw error when no secret available', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);
            delete process.env.STRIPE_WEBHOOK_SECRET;

            await expect(getStripeWebhookSecret()).rejects.toThrow('STRIPE_WEBHOOK_SECRET not configured');
        });
    });

    describe('clearStripeCache', () => {
        it('should clear cached stripe instance', () => {
            // Should not throw
            expect(() => clearStripeCache()).not.toThrow();
        });
    });
});
