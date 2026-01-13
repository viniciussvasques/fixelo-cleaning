/**
 * Client Rating API
 * 
 * Allows cleaners to rate customers after a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const ratingSchema = z.object({
    bookingId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    categories: z.object({
        punctuality: z.number().min(1).max(5).optional(),
        communication: z.number().min(1).max(5).optional(),
        cleanliness: z.number().min(1).max(5).optional(),
        respect: z.number().min(1).max(5).optional(),
    }).optional(),
    comment: z.string().max(500).optional(),
    isPrivate: z.boolean().default(true),
});

/**
 * GET - List cleaner's client ratings
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        const where: any = { cleanerId: cleaner.id };
        if (clientId) {
            where.clientId = clientId;
        }

        const ratings = await prisma.clientRating.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(ratings);

    } catch (error) {
        console.error('[ClientRating] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }
}

/**
 * POST - Create client rating
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = ratingSchema.parse(body);

        // Verify cleaner worked this job
        const booking = await prisma.booking.findFirst({
            where: {
                id: validatedData.bookingId,
                assignments: {
                    some: {
                        cleanerId: cleaner.id,
                        status: 'ACCEPTED'
                    }
                },
                status: 'COMPLETED'
            },
            select: { userId: true }
        });

        if (!booking) {
            return NextResponse.json({ 
                error: 'You can only rate clients from completed jobs you worked' 
            }, { status: 400 });
        }

        // Check if already rated
        const existingRating = await prisma.clientRating.findUnique({
            where: { 
                cleanerId_bookingId: {
                    cleanerId: cleaner.id,
                    bookingId: validatedData.bookingId
                }
            }
        });

        if (existingRating) {
            return NextResponse.json({ 
                error: 'You have already rated this client for this job' 
            }, { status: 400 });
        }

        const rating = await prisma.clientRating.create({
            data: {
                cleanerId: cleaner.id,
                clientId: booking.userId,
                bookingId: validatedData.bookingId,
                rating: validatedData.rating,
                categories: validatedData.categories,
                comment: validatedData.comment,
                isPrivate: validatedData.isPrivate ?? true,
            }
        });

        return NextResponse.json({
            success: true,
            rating,
            message: 'Client rated successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[ClientRating] POST error:', error);
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 });
    }
}
