import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { bookingId, rating, comment } = await req.json();

        if (!bookingId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ message: 'Invalid rating' }, { status: 400 });
        }

        // Get the booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: { cleaner: true },
                    take: 1,
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // Verify booking belongs to user
        if (booking.userId !== (session.user as any).id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Verify booking is completed
        if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ message: 'Can only review completed bookings' }, { status: 400 });
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findFirst({
            where: { bookingId }
        });

        if (existingReview) {
            return NextResponse.json({ message: 'Already reviewed' }, { status: 400 });
        }

        // A cleaner must be assigned to create a review
        const cleanerId = booking.assignments[0]?.cleanerId;
        if (!cleanerId) {
            return NextResponse.json({ message: 'No cleaner assigned to this booking' }, { status: 400 });
        }

        // Create review using correct field names from schema
        const review = await prisma.review.create({
            data: {
                bookingId,
                rating,
                comment: comment || null,
                userId: (session.user as any).id,  // Customer who wrote review
                cleanerId: cleanerId,              // Cleaner being reviewed
            }
        });

        // Note: Cleaner rating is calculated on-the-fly from reviews

        return NextResponse.json({ success: true, reviewId: review.id });
    } catch (error) {
        console.error('Create review error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const bookingId = url.searchParams.get('bookingId');

        if (bookingId) {
            const review = await prisma.review.findFirst({
                where: { bookingId },
            });
            return NextResponse.json(review);
        }

        // Get user's reviews
        const reviews = await prisma.review.findMany({
            where: { userId: (session.user as any).id },
            include: {
                booking: {
                    include: { serviceType: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error('Get reviews error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
