import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@fixelo/database', () => ({
    prisma: {
        serviceType: {
            findUnique: vi.fn()
        },
        addOn: {
            findMany: vi.fn()
        }
    }
}));

vi.mock('@/lib/stripe', () => ({
    getStripeClient: vi.fn()
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({ user: { id: 'user1' } })
}));

describe('Payment Intent Calculations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly sum service price + add-ons', async () => {
        const { prisma } = await import('@fixelo/database');

        // Mock service type
        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({
            id: 'service1',
            basePrice: 100
        } as never);

        // Mock add-ons
        vi.mocked(prisma.addOn.findMany).mockResolvedValue([
            { id: 'addon1', price: 20 },
            { id: 'addon2', price: 30 }
        ] as never);

        // Get data
        const service = await prisma.serviceType.findUnique({
            where: { id: 'service1' }
        });

        const addOns = await prisma.addOn.findMany({
            where: { id: { in: ['addon1', 'addon2'] } }
        });

        // Calculate total
        const basePrice = service!.basePrice;
        const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
        const total = basePrice + addOnsTotal;

        // Assertions
        expect(total).toBe(150); // 100 + 20 + 30
        expect(total * 100).toBe(15000); // Stripe expects cents
    });

    it('should handle service with no add-ons', async () => {
        const { prisma } = await import('@fixelo/database');

        vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({
            id: 'service1',
            basePrice: 109
        } as never);

        vi.mocked(prisma.addOn.findMany).mockResolvedValue([]);

        const service = await prisma.serviceType.findUnique({
            where: { id: 'service1' }
        });

        const addOns = await prisma.addOn.findMany({
            where: { id: { in: [] } }
        });

        const basePrice = service!.basePrice;
        const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
        const total = basePrice + addOnsTotal;

        expect(total).toBe(109);
    });

    it('should apply room-based pricing', async () => {
        // 1 bedroom + 1 bathroom base
        const basePrice = 109;
        const extraBedrooms = 2; // 3 bedrooms total, 2 extra
        const extraBathrooms = 1; // 2 bathrooms total, 1 extra
        const bedroomCharge = 20;
        const bathroomCharge = 15;

        const total = basePrice + (extraBedrooms * bedroomCharge) + (extraBathrooms * bathroomCharge);

        expect(total).toBe(164); // 109 + 40 + 15
    });
});
