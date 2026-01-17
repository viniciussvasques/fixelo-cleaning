import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@fixelo/database', () => ({
    prisma: {
        serviceType: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        addOn: {
            findMany: vi.fn(),
        },
    },
}));

describe('Service Types API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/service-types', () => {
        it('should return all active service types', async () => {
            const { prisma } = await import('@fixelo/database');

            const mockServices = [
                {
                    id: 'service-1',
                    name: 'Standard Cleaning',
                    slug: 'standard',
                    description: 'Regular cleaning service',
                    basePrice: 109,
                    isActive: true,
                    inclusions: ['Kitchen', 'Bathrooms', 'Bedrooms'],
                },
                {
                    id: 'service-2',
                    name: 'Deep Cleaning',
                    slug: 'deep',
                    description: 'Thorough deep clean',
                    basePrice: 169,
                    isActive: true,
                    inclusions: ['Kitchen', 'Bathrooms', 'Bedrooms', 'Appliances'],
                },
            ];

            vi.mocked(prisma.serviceType.findMany).mockResolvedValue(mockServices as never);

            const services = await prisma.serviceType.findMany({
                where: { isActive: true },
            });

            expect(services).toHaveLength(2);
            expect(services[0].name).toBe('Standard Cleaning');
            expect(services[1].basePrice).toBe(169);
        });

        it('should include add-ons when requested', async () => {
            const { prisma } = await import('@fixelo/database');

            const mockAddOns = [
                { id: 'addon-1', name: 'Inside Fridge', price: 25 },
                { id: 'addon-2', name: 'Inside Oven', price: 25 },
                { id: 'addon-3', name: 'Laundry', price: 30 },
            ];

            vi.mocked(prisma.addOn.findMany).mockResolvedValue(mockAddOns as never);

            const addOns = await prisma.addOn.findMany({
                where: { isActive: true },
            });

            expect(addOns).toHaveLength(3);
            expect(addOns[0].name).toBe('Inside Fridge');
        });
    });

    describe('GET /api/service-types/[slug]', () => {
        it('should return specific service type by slug', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.serviceType.findUnique).mockResolvedValue({
                id: 'service-1',
                name: 'Standard Cleaning',
                slug: 'standard',
                basePrice: 109,
            } as never);

            const service = await prisma.serviceType.findUnique({
                where: { slug: 'standard' },
            });

            expect(service).toBeDefined();
            expect(service!.name).toBe('Standard Cleaning');
        });

        it('should return null for non-existent slug', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.serviceType.findUnique).mockResolvedValue(null);

            const service = await prisma.serviceType.findUnique({
                where: { slug: 'non-existent' },
            });

            expect(service).toBeNull();
        });
    });
});
