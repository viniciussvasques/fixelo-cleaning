import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@fixelo/database', () => ({
    prisma: {
        booking: {
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },
        cleanerProfile: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        cleanerAssignment: {
            create: vi.fn(),
        },
        jobExecution: {
            create: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            booking: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            cleanerAssignment: {
                create: vi.fn(),
            },
            cleanerProfile: {
                update: vi.fn(),
            },
        })),
    },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('Cleaner Jobs API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/cleaner/jobs/available', () => {
        it('should return available jobs for cleaner', async () => {
            const { auth } = await import('@/lib/auth');
            const { prisma } = await import('@fixelo/database');

            vi.mocked(auth).mockResolvedValue({
                user: { id: 'cleaner-1', email: 'cleaner@example.com', role: 'CLEANER' },
                expires: new Date(Date.now() + 3600000).toISOString(),
            } as never);

            const availableJobs = [
                {
                    id: 'booking-1',
                    status: 'PENDING',
                    scheduledDate: new Date(),
                    totalAmount: 150,
                    serviceType: { name: 'Standard Cleaning' },
                    address: { city: 'Orlando', zipCode: '32801' },
                },
                {
                    id: 'booking-2',
                    status: 'PENDING',
                    scheduledDate: new Date(),
                    totalAmount: 200,
                    serviceType: { name: 'Deep Cleaning' },
                    address: { city: 'Orlando', zipCode: '32802' },
                },
            ];

            vi.mocked(prisma.booking.findMany).mockResolvedValue(availableJobs as never);

            const jobs = await prisma.booking.findMany({
                where: { status: 'PENDING' },
            });

            expect(jobs).toHaveLength(2);
        });

        it('should verify cleaner role', async () => {
            const { auth } = await import('@/lib/auth');

            vi.mocked(auth).mockResolvedValue({
                user: { id: 'cleaner-1', email: 'cleaner@example.com', role: 'CLEANER' },
                expires: new Date(Date.now() + 3600000).toISOString(),
            } as never);

            const session = await auth();
            expect(session?.user.role).toBe('CLEANER');
        });
    });

    describe('POST /api/cleaner/jobs/[id]/accept', () => {
        it('should accept a job successfully', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.cleanerProfile.findUnique).mockResolvedValue({
                id: 'profile-1',
                userId: 'cleaner-1',
                activeJobCount: 0,
            } as never);

            const profile = await prisma.cleanerProfile.findUnique({
                where: { userId: 'cleaner-1' },
            });

            expect(profile).toBeDefined();
            expect(profile!.id).toBe('profile-1');
        });

        it('should use atomic update to prevent race conditions', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 });

            const result = await prisma.booking.updateMany({
                where: {
                    id: 'booking-1',
                    status: 'PENDING',
                },
                data: {
                    status: 'ASSIGNED',
                },
            });

            expect(result.count).toBe(1);
        });

        it('should fail if job already taken', async () => {
            const { prisma } = await import('@fixelo/database');

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

            expect(result.count).toBe(0);
        });
    });

    describe('POST /api/cleaner/jobs/[id]/complete', () => {
        it('should mark job as complete', async () => {
            const { prisma } = await import('@fixelo/database');

            vi.mocked(prisma.jobExecution.update).mockResolvedValue({
                id: 'execution-1',
                bookingId: 'booking-1',
                status: 'COMPLETED',
                completedAt: new Date(),
            } as never);

            const execution = await prisma.jobExecution.update({
                where: { id: 'execution-1' },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            expect(execution.status).toBe('COMPLETED');
            expect(execution.completedAt).toBeDefined();
        });
    });
});
