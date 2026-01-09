import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { NextResponse } from 'next/server';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { rating, comment, qualityRating, punctualityRating, friendlinessRating } = await req.json();

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: { review: true, assignments: { where: { status: 'ACCEPTED' }, take: 1 } }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
        }

        if (booking.review) {
            return NextResponse.json({ error: 'Review already exists' }, { status: 400 });
        }

        const assignment = booking.assignments[0];
        if (!assignment) {
            return NextResponse.json({ error: 'No cleaner assigned to this booking' }, { status: 400 });
        }

        // Create review and update cleaner in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const review = await tx.review.create({
                data: {
                    bookingId: params.id,
                    userId: session.user.id!,
                    cleanerId: assignment.cleanerId,
                    rating,
                    comment,
                    qualityRating,
                    punctualityRating,
                    friendlinessRating,
                }
            });

            // Update cleaner stats
            const cleaner = await tx.cleanerProfile.findUnique({
                where: { id: assignment.cleanerId }
            });

            if (cleaner) {
                const newTotalRatings = cleaner.totalRatings + 1;
                const newRating = ((cleaner.rating * cleaner.totalRatings) + rating) / newTotalRatings;

                await tx.cleanerProfile.update({
                    where: { id: assignment.cleanerId },
                    data: {
                        rating: newRating,
                        totalRatings: newTotalRatings,
                        // Update quality score (normalized 0-1)
                        qualityScore: newRating / 5
                    }
                });
            }

            return review;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
