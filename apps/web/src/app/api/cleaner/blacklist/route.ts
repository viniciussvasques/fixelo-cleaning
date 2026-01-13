/**
 * Cleaner Blacklist API
 * 
 * Allows cleaners to block clients from future job offers
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const blacklistSchema = z.object({
    clientId: z.string().uuid(),
    reason: z.string().max(500).optional(),
});

/**
 * GET - List blacklisted clients
 */
export async function GET() {
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

        const blacklist = await prisma.cleanerBlacklist.findMany({
            where: { cleanerId: cleaner.id },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(blacklist);

    } catch (error) {
        console.error('[Blacklist] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 });
    }
}

/**
 * POST - Add client to blacklist
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
        const validatedData = blacklistSchema.parse(body);

        // Verify cleaner has worked with this client before
        const hasWorkedWith = await prisma.booking.findFirst({
            where: {
                userId: validatedData.clientId,
                assignments: {
                    some: {
                        cleanerId: cleaner.id,
                        status: 'ACCEPTED'
                    }
                }
            }
        });

        if (!hasWorkedWith) {
            return NextResponse.json({ 
                error: 'You can only blacklist clients you have worked with' 
            }, { status: 400 });
        }

        // Check if already blacklisted
        const existing = await prisma.cleanerBlacklist.findUnique({
            where: {
                cleanerId_clientId: {
                    cleanerId: cleaner.id,
                    clientId: validatedData.clientId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ 
                error: 'Client is already on your blacklist' 
            }, { status: 400 });
        }

        const entry = await prisma.cleanerBlacklist.create({
            data: {
                cleanerId: cleaner.id,
                clientId: validatedData.clientId,
                reason: validatedData.reason,
            },
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            entry,
            message: `${entry.client.firstName} has been added to your blacklist`
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Blacklist] POST error:', error);
        return NextResponse.json({ error: 'Failed to add to blacklist' }, { status: 500 });
    }
}

/**
 * DELETE - Remove client from blacklist
 */
export async function DELETE(request: NextRequest) {
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

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
        }

        await prisma.cleanerBlacklist.delete({
            where: {
                cleanerId_clientId: {
                    cleanerId: cleaner.id,
                    clientId
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Client removed from blacklist'
        });

    } catch (error) {
        console.error('[Blacklist] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to remove from blacklist' }, { status: 500 });
    }
}
