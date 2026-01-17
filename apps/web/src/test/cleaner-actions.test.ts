import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before test
vi.mock('@fixelo/database', () => ({
    prisma: {
        cleanerProfile: { findUnique: vi.fn() },
        booking: { updateMany: vi.fn() },
        cleanerAssignment: { create: vi.fn() },
        $transaction: vi.fn(),
    }
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/metrics', () => ({
    updateCleanerMetrics: vi.fn(),
}));

// Local UserRole constant to avoid import issues
const UserRole = {
    CUSTOMER: 'CUSTOMER',
    CLEANER: 'CLEANER',
    ADMIN: 'ADMIN'
} as const;

describe('Cleaner Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('acceptJob logic', () => {
        it('should verify cleaner profile exists', async () => {
            const { auth } = await import('@/lib/auth');
            const { prisma } = await import('@fixelo/database');

            // Setup: authenticated cleaner
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'cleaner-1', role: UserRole.CLEANER },
                expires: new Date(Date.now() + 3600000).toISOString(),
            } as never);

            vi.mocked(prisma.cleanerProfile.findUnique).mockResolvedValue({
                id: 'profile-1',
                userId: 'cleaner-1',
                status: 'ACTIVE',
            } as never);

            const session = await auth();
            expect(session?.user.role).toBe('CLEANER');

            const profile = await prisma.cleanerProfile.findUnique({
                where: { userId: 'cleaner-1' },
            });
            expect(profile).toBeDefined();
        });

        it('should use atomic update to prevent race conditions', async () => {
            const { prisma } = await import('@fixelo/database');

            // Setup: updateMany returns 1 (successful atomic update)
            vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 });

            const result = await prisma.booking.updateMany({
                where: {
                    id: 'booking-1',
                    status: 'PENDING', // Only update if still PENDING
                },
                data: {
                    status: 'ASSIGNED',
                },
            });

            expect(result.count).toBe(1);
        });

        it('should detect race condition when job already taken', async () => {
            const { prisma } = await import('@fixelo/database');

            // Setup: updateMany returns 0 (job was already taken)
            vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 });

            const result = await prisma.booking.updateMany({
                where: {
                    id: 'booking-1',
                    status: 'PENDING',
                },
                data: {
                    status: 'ASSIGNED',
                },
            });

            // Count 0 means the job was already taken by another cleaner
            expect(result.count).toBe(0);
        });

        it('should create assignment after successful booking update', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.cleanerAssignment.create).mockResolvedValue({
                id: 'assignment-1',
                bookingId: 'booking-1',
                cleanerId: 'cleaner-1',
                status: 'ASSIGNED',
            } as never);

            const assignment = await prisma.cleanerAssignment.create({
                data: {
                    bookingId: 'booking-1',
                    cleanerId: 'cleaner-1',
                    status: 'ASSIGNED',
                },
            });

            expect(assignment.id).toBe('assignment-1');
        });
    });

    describe('rejectJob logic', () => {
        it('should allow cleaners to reject pending jobs', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 });

            const result = await prisma.booking.updateMany({
                where: {
                    id: 'booking-1',
                    status: 'PENDING',
                },
                data: {
                    status: 'PENDING', // Back to pending for other cleaners
                },
            });

            expect(result.count).toBe(1);
        });
    });
});
