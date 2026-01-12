import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus, BookingStatus } from '@prisma/client';
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

        // 3. Get assignment and verify ownership
        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id },
            include: { booking: true }
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

        // 5. Check if assignment has expired
        if (assignment.expiresAt && new Date() > assignment.expiresAt) {
            return NextResponse.json(
                { error: { code: 'ASSIGNMENT_EXPIRED', message: 'This job offer has expired' } },
                { status: 400 }
            );
        }

        // 6. Update assignment to ACCEPTED
        await prisma.cleanerAssignment.update({
            where: { id },
            data: {
                status: AssignmentStatus.ACCEPTED,
                acceptedAt: new Date()
            }
        });

        // 7. Update Booking status to ACCEPTED
        await prisma.booking.update({
            where: { id: assignment.bookingId },
            data: {
                status: BookingStatus.ACCEPTED
            }
        });

        // 8. Reject other pending assignments for this booking
        await prisma.cleanerAssignment.updateMany({
            where: {
                bookingId: assignment.bookingId,
                id: { not: id },
                status: 'PENDING'
            },
            data: {
                status: AssignmentStatus.CANCELLED
            }
        });

        // 9. Update cleaner metrics
        await prisma.cleanerProfile.update({
            where: { id: cleaner.id },
            data: { totalJobsAccepted: { increment: 1 } }
        });

        return NextResponse.json({
            success: true,
            message: 'Job accepted successfully',
            assignmentId: id,
            bookingId: assignment.bookingId
        });

    } catch (error) {
        console.error('[AcceptJob] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to accept job' } },
            { status: 500 }
        );
    }
}
