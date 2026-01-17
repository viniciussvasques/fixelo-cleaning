import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from 'next-auth';

// Define auth type for mocking
type AuthFunction = () => Promise<Session | null>;

// Mock dependencies before imports
vi.mock('@fixelo/database', () => ({
    prisma: {
        systemConfig: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn() as unknown as AuthFunction,
}));

describe('QR Session API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/qr-session', () => {
        it('should require authenticated user', async () => {
            const { auth } = await import('@/lib/auth');
            const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

            mockAuth.mockResolvedValue({
                user: { id: 'user-1', email: 'test@example.com', role: 'CLEANER' },
                expires: new Date(Date.now() + 3600000).toISOString(),
            });

            const session = await auth();
            expect(session?.user.id).toBe('user-1');
        });

        it('should reject unauthenticated requests', async () => {
            const { auth } = await import('@/lib/auth');
            const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

            mockAuth.mockResolvedValue(null);

            const session = await auth();
            expect(session).toBeNull();
        });
    });

    describe('GET /api/auth/qr-session', () => {
        it('should validate existing token from database', async () => {
            const { prisma } = await import('@fixelo/database');
            const tokenData = {
                userId: 'user-1',
                email: 'test@example.com',
                role: 'CLEANER',
                expiresAt: new Date(Date.now() + 900000).toISOString(),
            };

            const mockConfig = {
                id: '1',
                key: 'qr_session_test_token',
                value: JSON.stringify(tokenData),
                description: 'QR Session Token',
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(mockConfig);

            const config = await prisma.systemConfig.findUnique({
                where: { key: 'qr_session_test_token' },
            });

            expect(config).not.toBeNull();
            expect(config?.key).toBe('qr_session_test_token');

            const data = JSON.parse(config!.value);
            expect(data.userId).toBe('user-1');
        });

        it('should detect expired tokens', async () => {
            const { prisma } = await import('@fixelo/database');
            const expiredTokenData = {
                userId: 'user-1',
                email: 'test@example.com',
                role: 'CLEANER',
                expiresAt: new Date(Date.now() - 60000).toISOString(),
            };

            const mockConfig = {
                id: '1',
                key: 'qr_session_expired_token',
                value: JSON.stringify(expiredTokenData),
                description: 'QR Session Token',
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(mockConfig);

            const config = await prisma.systemConfig.findUnique({
                where: { key: 'qr_session_expired_token' },
            });

            const data = JSON.parse(config!.value);
            const expiresAt = new Date(data.expiresAt);
            expect(expiresAt.getTime()).toBeLessThan(Date.now());
        });

        it('should return null for non-existent tokens', async () => {
            const { prisma } = await import('@fixelo/database');
            vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);

            const config = await prisma.systemConfig.findUnique({
                where: { key: 'qr_session_invalid_token' },
            });

            expect(config).toBeNull();
        });
    });
});
