import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transporter } from 'nodemailer';

// Type for mock transporter
interface MockTransporter {
    sendMail: ReturnType<typeof vi.fn>;
}

// Mock nodemailer with proper types
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn((): MockTransporter => ({
    sendMail: mockSendMail,
}));

vi.mock('nodemailer', () => ({
    default: {
        createTransport: mockCreateTransport,
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
        mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    });

    describe('sendEmail', () => {
        it('should send email successfully', async () => {
            const { sendEmail, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test body</p>',
            });

            expect(result).toBe(true);
            expect(mockCreateTransport).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalled();
        });

        it('should send email with text content', async () => {
            const { sendEmail, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Plain text body',
            });

            expect(result).toBe(true);
        });

        it('should use custom from address', async () => {
            const { sendEmail, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Body',
                from: 'custom@example.com',
            });

            expect(result).toBe(true);
        });

        it('should throw error when email fails', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

            const { sendEmail, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

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
            const { sendEmailNotification, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            mockSendMail.mockResolvedValueOnce({ messageId: 'msg-1' });

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
            const { sendEmailNotification, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            mockSendMail.mockRejectedValueOnce(new Error('Failed to send'));

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
            const { sendEmailNotification, clearEmailConfigCache } = await import('./email');
            clearEmailConfigCache();

            mockSendMail.mockResolvedValueOnce({ messageId: 'msg-2' });

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
        it('should not throw when clearing cache', async () => {
            const { clearEmailConfigCache } = await import('./email');
            expect(() => clearEmailConfigCache()).not.toThrow();
        });
    });
});
