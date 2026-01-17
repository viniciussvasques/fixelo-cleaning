import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, sendEmailNotification, clearEmailConfigCache } from './email';

// Mock nodemailer
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        })),
    },
}));

// Mock the database
vi.mock('@fixelo/database', () => ({
    prisma: {
        systemConfig: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        notification: {
            create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
        },
    },
    Prisma: {
        InputJsonValue: {},
    },
}));

describe('Email Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearEmailConfigCache();
    });

    describe('sendEmail', () => {
        it('should send email successfully', async () => {
            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test body</p>',
            });

            expect(result).toBe(true);
        });

        it('should send email with text content', async () => {
            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Plain text body',
            });

            expect(result).toBe(true);
        });

        it('should use custom from address', async () => {
            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Body',
                from: 'custom@example.com',
            });

            expect(result).toBe(true);
        });

        it('should throw error when email fails', async () => {
            const nodemailer = await import('nodemailer');
            vi.mocked(nodemailer.default.createTransport).mockReturnValue({
                sendMail: vi.fn().mockRejectedValue(new Error('SMTP Error')),
            } as ReturnType<typeof nodemailer.default.createTransport>);

            await expect(sendEmail({
                to: 'test@example.com',
                subject: 'Test',
                text: 'Body',
            })).rejects.toThrow('SMTP Error');
        });
    });

    describe('sendEmailNotification', () => {
        it('should send email and create notification record', async () => {
            const { prisma } = await import('@fixelo/database');
            const nodemailer = await import('nodemailer');

            vi.mocked(nodemailer.default.createTransport).mockReturnValue({
                sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
            } as ReturnType<typeof nodemailer.default.createTransport>);

            await sendEmailNotification('user-123', {
                to: 'user@example.com',
                subject: 'Notification',
                html: '<p>Hello</p>',
            });

            expect(prisma.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: 'user-123',
                        type: 'EMAIL',
                        status: 'SENT',
                    }),
                })
            );
        });

        it('should create failed notification when email fails', async () => {
            const { prisma } = await import('@fixelo/database');
            const nodemailer = await import('nodemailer');

            vi.mocked(nodemailer.default.createTransport).mockReturnValue({
                sendMail: vi.fn().mockRejectedValue(new Error('Failed to send')),
            } as ReturnType<typeof nodemailer.default.createTransport>);

            await sendEmailNotification('user-123', {
                to: 'user@example.com',
                subject: 'Notification',
                text: 'Hello',
            });

            expect(prisma.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: 'user-123',
                        status: 'FAILED',
                    }),
                })
            );
        });

        it('should include metadata in notification', async () => {
            const { prisma } = await import('@fixelo/database');
            const nodemailer = await import('nodemailer');

            vi.mocked(nodemailer.default.createTransport).mockReturnValue({
                sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-2' }),
            } as ReturnType<typeof nodemailer.default.createTransport>);

            await sendEmailNotification(
                'user-123',
                {
                    to: 'user@example.com',
                    subject: 'Notification',
                    text: 'Hello',
                },
                { bookingId: 'booking-456' }
            );

            expect(prisma.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        metadata: { bookingId: 'booking-456' },
                    }),
                })
            );
        });
    });

    describe('clearEmailConfigCache', () => {
        it('should not throw when clearing cache', () => {
            expect(() => clearEmailConfigCache()).not.toThrow();
        });
    });
});
