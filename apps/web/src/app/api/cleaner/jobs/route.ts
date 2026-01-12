import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // Get authenticated user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }
        const userId = session.user.id;

        // Find cleaner profile
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId }
        });

        if (!cleaner) {
            return NextResponse.json(
                { error: { code: 'CLEANER_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        // Build query based on status
        const whereClause: {
            cleanerId: string;
            status?: AssignmentStatus;
            completedAt?: { not: null } | null;
        } = {
            cleanerId: cleaner.id
        };

        if (status === 'pending') {
            whereClause.status = AssignmentStatus.PENDING;
        } else if (status === 'upcoming') {
            whereClause.status = AssignmentStatus.ACCEPTED;
            // And not completed
            whereClause.completedAt = null;
        } else if (status === 'completed') {
            whereClause.completedAt = { not: null };
        }

        const assignments = await prisma.cleanerAssignment.findMany({
            where: whereClause,
            include: {
                booking: {
                    include: {
                        serviceType: true,
                        address: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ jobs: assignments });

    } catch (error) {
        console.error('[Jobs] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' } },
            { status: 500 }
        );
    }
}
