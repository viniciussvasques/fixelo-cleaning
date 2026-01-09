/**
 * Chat API - Get conversation messages
 * 
 * Returns messages between customer and cleaner for a booking.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export async function GET(
    request: Request,
    { params }: { params: { bookingId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.bookingId;

        // Verify user has access to this booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: true,
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: { include: { user: true } } },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isCustomer = booking.userId === session.user.id;
        const isCleaner = booking.assignments.some(
            (a: { cleaner: { userId: string; }; }) => a.cleaner.userId === session.user.id
        );

        if (!isCustomer && !isCleaner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get messages
        const messages = await prisma.message.findMany({
            where: { bookingId },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({
            messages,
            booking: {
                id: booking.id,
                status: booking.status,
            },
        });
    } catch (error) {
        console.error('[Chat] Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { bookingId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.bookingId;
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        // Verify user has access
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: true },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isCustomer = booking.userId === session.user.id;
        const isCleaner = booking.assignments.some(
            (a: { cleaner: { userId: string; }; }) => a.cleaner.userId === session.user.id
        );

        if (!isCustomer && !isCleaner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                bookingId,
                senderId: session.user.id,
                content,
            },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error('[Chat] Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
