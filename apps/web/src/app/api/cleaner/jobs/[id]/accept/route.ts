import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus, BookingStatus } from '@prisma/client';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 1. Get assignment
        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id },
            include: { booking: true }
        });

        if (!assignment) {
            return new NextResponse("Assignment not found", { status: 404 });
        }

        if (assignment.status !== 'PENDING') {
            return new NextResponse("Job is no longer pending", { status: 400 });
        }

        // 2. Update assignment to ACCEPTED
        await prisma.cleanerAssignment.update({
            where: { id },
            data: {
                status: AssignmentStatus.ACCEPTED,
                acceptedAt: new Date()
            }
        });

        // 3. Update Booking status to ASSIGNED/ACCEPTED
        await prisma.booking.update({
            where: { id: assignment.bookingId },
            data: {
                status: BookingStatus.ACCEPTED
            }
        });

        // 4. Reject other pending assignments for this booking (if any)
        // This logic belongs in a service but implementing simple version here
        await prisma.cleanerAssignment.updateMany({
            where: {
                bookingId: assignment.bookingId,
                id: { not: id },
                status: 'PENDING'
            },
            data: {
                status: AssignmentStatus.CANCELLED // or REJECTED/EXPIRED
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Accept job error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
