import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Validate Authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const { id } = params;

        // 2. Get cleaner profile for logged in user
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json(
                { error: { code: 'CLEANER_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        // 3. Get assignment
        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id }
        });

        if (!assignment) {
            return NextResponse.json(
                { error: { code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' } },
                { status: 404 }
            );
        }

        // 4. Verify the assignment belongs to the logged in cleaner
        if (assignment.cleanerId !== cleaner.id) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'You are not assigned to this job' } },
                { status: 403 }
            );
        }

        if (assignment.status !== 'PENDING') {
            return NextResponse.json(
                { error: { code: 'INVALID_STATUS', message: 'Job is no longer pending' } },
                { status: 400 }
            );
        }

        // 5. Update to REJECTED
        await prisma.cleanerAssignment.update({
            where: { id },
            data: {
                status: AssignmentStatus.REJECTED,
                rejectedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Job rejected successfully'
        });

    } catch (error) {
        console.error('[RejectJob] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to reject job' } },
            { status: 500 }
        );
    }
}
