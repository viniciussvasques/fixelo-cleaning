import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, BookingStatus } from '@fixelo/database';
import { z } from 'zod';

const cancelSchema = z.object({
    reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)'),
});

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = cancelSchema.parse(body);

        // Get booking
        const booking = await prisma.booking.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Check if can cancel
        if (booking.status === BookingStatus.COMPLETED) {
            return NextResponse.json(
                { error: 'Cannot cancel completed booking' },
                { status: 400 }
            );
        }

        if (booking.status === BookingStatus.CANCELLED) {
            return NextResponse.json(
                { error: 'Booking already cancelled' },
                { status: 400 }
            );
        }

        // Cancel booking
        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: {
                status: BookingStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: session.user.id,
                cancellationReason: reason
            }
        });

        // TODO: Notify cleaner if assigned
        // TODO: Process refund if paid

        return NextResponse.json(updatedBooking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Booking cancellation error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel booking' },
            { status: 500 }
        );
    }
}
