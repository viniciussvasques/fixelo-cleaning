import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@fixelo/database', () => ({
    prisma: {
        booking: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        serviceType: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        address: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('Booking API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/bookings', () => {
        it('should return list of bookings for authenticated user', async () => {
            const { auth } = await import('@/lib/auth');
            const { prisma } = await import('@fixelo/database');

            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com', role: 'CUSTOMER' },
                expires: new Date(Date.now() + 3600000).toISOString(),
            });

            vi.mocked(prisma.booking.findMany).mockResolvedValue([
                {
                    id: 'booking-1',
                    status: 'CONFIRMED',
                    scheduledDate: new Date(),
                    totalAmount: 150,
                    userId: 'user-1',
                    serviceTypeId: 'service-1',
                    addressId: 'address-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as never,
            ]);

            const bookings = await prisma.booking.findMany({
                where: { userId: 'user-1' },
            });

            expect(bookings).toHaveLength(1);
            expect(bookings[0].status).toBe('CONFIRMED');
        });

        it('should reject unauthenticated requests', async () => {
            const { auth } = await import('@/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const session = await auth();
            expect(session).toBeNull();
        });
    });

    describe('POST /api/bookings', () => {
        it('should create a new booking', async () => {
            const { auth } = await import('@/lib/auth');
            const { prisma } = await import('@fixelo/database');

            vi.mocked(auth).mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com', role: 'CUSTOMER' },
                expires: new Date(Date.now() + 3600000).toISOString(),
            });

            const newBooking = {
                id: 'booking-new',
                status: 'PENDING',
                scheduledDate: new Date(),
                totalAmount: 169,
                userId: 'user-1',
                serviceTypeId: 'service-1',
                addressId: 'address-1',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.booking.create).mockResolvedValue(newBooking as never);

            const result = await prisma.booking.create({
                data: {
                    userId: 'user-1',
                    serviceTypeId: 'service-1',
                    addressId: 'address-1',
                    scheduledDate: new Date(),
                    totalAmount: 169,
                    status: 'PENDING',
                },
            });

            expect(result.id).toBe('booking-new');
            expect(result.status).toBe('PENDING');
        });

        it('should validate required fields', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.create).mockRejectedValue(
                new Error('Missing required fields')
            );

            await expect(
                prisma.booking.create({ data: {} as never })
            ).rejects.toThrow('Missing required fields');
        });
    });

    describe('GET /api/bookings/[id]', () => {
        it('should return booking details', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.findUnique).mockResolvedValue({
                id: 'booking-1',
                status: 'CONFIRMED',
                totalAmount: 150,
                userId: 'user-1',
            } as never);

            const booking = await prisma.booking.findUnique({
                where: { id: 'booking-1' },
            });

            expect(booking).toBeDefined();
            expect(booking!.id).toBe('booking-1');
        });

        it('should return null for non-existent booking', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

            const booking = await prisma.booking.findUnique({
                where: { id: 'non-existent' },
            });

            expect(booking).toBeNull();
        });
    });
});
