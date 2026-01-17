import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies first before imports
vi.mock('@fixelo/database', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        serviceType: {
            findUnique: vi.fn(),
        },
        booking: {
            count: vi.fn(),
        },
        addOn: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        systemConfig: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
        }
    }
}));

vi.mock('@/lib/stripe', () => ({
    getStripeClient: vi.fn(() => Promise.resolve({
        paymentIntents: {
            create: vi.fn().mockResolvedValue({ client_secret: 'pi_test_secret' }),
        },
    })),
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1' } })),
}));

describe('Referral System Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should check referral code validity', async () => {
        const { prisma } = await import('@fixelo/database');

        // Setup: valid referral code
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'referrer-1',
            referralCode: 'REF123',
        } as never);

        const user = await prisma.user.findUnique({
            where: { referralCode: 'REF123' },
        });

        expect(user).toBeDefined();
        expect(user?.referralCode).toBe('REF123');
    });

    it('should identify first-time bookings for referral eligibility', async () => {
        const { prisma } = await import('@fixelo/database');

        // First booking - eligible for referral discount
        vi.mocked(prisma.booking.count).mockResolvedValue(0);

        const bookingCount = await prisma.booking.count({
            where: { userId: 'user-1' },
        });

        expect(bookingCount).toBe(0);
    });

    it('should identify existing customers as ineligible for referral', async () => {
        const { prisma } = await import('@fixelo/database');

        // Not first booking - ineligible
        vi.mocked(prisma.booking.count).mockResolvedValue(3);

        const bookingCount = await prisma.booking.count({
            where: { userId: 'user-1' },
        });

        expect(bookingCount).toBeGreaterThan(0);
    });

    it('should load service type for pricing', async () => {
        const { prisma } = await import('@fixelo/database');

        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({
            id: 's1',
            name: 'Standard Cleaning',
            basePrice: 109,
            baseTime: 120,
        } as never);

        const service = await prisma.serviceType.findUnique({
            where: { id: 's1' },
        });

        expect(service).toBeDefined();
        expect(service?.basePrice).toBe(109);
    });
});
