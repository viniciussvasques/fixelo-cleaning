/**
 * Booking Messages API
 * 
 * Real-time chat between cleaner and customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';
import { sendSMSNotification } from '@/lib/sms';

interface Props {
    params: { id: string };
}

const messageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000),
});

/**
 * GET - Get messages for a booking
 */
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;

        // Verify user has access to this booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                assignments: {
                    include: {
                        cleaner: {
                            select: { userId: true }
                        }
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Check if user is the customer or assigned cleaner
        const isCustomer = booking.userId === session.user.id;
        const isCleaner = booking.assignments.some(
            a => a.cleaner.userId === session.user.id
        );

        if (!isCustomer && !isCleaner) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get messages
        const messages = await prisma.message.findMany({
            where: { bookingId },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                bookingId,
                senderId: { not: session.user.id },
                read: false
            },
            data: { read: true }
        });

        return NextResponse.json({
            messages,
            booking: {
                id: booking.id,
                status: booking.status,
                userId: booking.userId,
                cleanerId: booking.assignments[0]?.cleaner.userId
            }
        });

    } catch (error) {
        console.error('[Messages] GET error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch messages' 
        }, { status: 500 });
    }
}

/**
 * POST - Send a message
 */
export async function POST(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;
        const body = await request.json();
        const validatedData = messageSchema.parse(body);

        // Verify user has access
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: { id: true, firstName: true, phone: true }
                },
                assignments: {
                    include: {
                        cleaner: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, phone: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isCustomer = booking.userId === session.user.id;
        const cleanerAssignment = booking.assignments.find(
            a => a.cleaner.user.id === session.user.id
        );
        const isCleaner = !!cleanerAssignment;

        if (!isCustomer && !isCleaner) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                bookingId,
                senderId: session.user.id,
                content: validatedData.content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });

        // Notify recipient via SMS (optional, for important messages)
        const recipient = isCustomer 
            ? cleanerAssignment?.cleaner.user 
            : booking.user;

        if (recipient?.phone) {
            try {
                const senderName = session.user.name || 'Someone';
                await sendSMSNotification(
                    recipient.id,
                    recipient.phone,
                    `New message from ${senderName} about your Fixelo booking: "${validatedData.content.slice(0, 50)}${validatedData.content.length > 50 ? '...' : ''}"`,
                    { bookingId, type: 'NEW_MESSAGE' }
                );
            } catch (err) {
                // Don't fail the message send if SMS fails
                console.error('Failed to send message notification SMS:', err);
            }
        }

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Messages] POST error:', error);
        return NextResponse.json({ 
            error: 'Failed to send message' 
        }, { status: 500 });
    }
}
