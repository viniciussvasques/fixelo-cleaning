'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { revalidatePath } from 'next/cache';

export async function getMessages(bookingId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    // Verify access
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            assignments: {
                include: { cleaner: true }
            }
        }
    });

    if (!booking) throw new Error('Booking not found');

    const isCustomer = booking.userId === session.user.id;
    const isAssignedCleaner = booking.assignments.some(
        a => a.cleaner.userId === session.user.id && a.status === 'ACCEPTED'
    );
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCustomer && !isAssignedCleaner && !isAdmin) {
        throw new Error('Unauthorized to view this chat');
    }

    return await prisma.message.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
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
}

export async function sendMessage(bookingId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    if (!content.trim()) return;

    // Verify access
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            assignments: {
                include: { cleaner: true }
            }
        }
    });

    if (!booking) throw new Error('Booking not found');

    const isCustomer = booking.userId === session.user.id;
    const isAssignedCleaner = booking.assignments.some(
        a => a.cleaner.userId === session.user.id && a.status === 'ACCEPTED'
    );
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCustomer && !isAssignedCleaner && !isAdmin) {
        throw new Error('Unauthorized to send message');
    }

    const message = await prisma.message.create({
        data: {
            bookingId,
            senderId: session.user.id,
            content,
            read: false
        }
    });

    // Revalidate paths
    revalidatePath(`/dashboard/bookings/${bookingId}`);
    revalidatePath(`/cleaner/jobs/${bookingId}`);

    return message;
}
