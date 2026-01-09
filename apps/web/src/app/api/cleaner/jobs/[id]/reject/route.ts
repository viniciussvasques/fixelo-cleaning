import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus } from '@prisma/client';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id }
        });

        if (!assignment) {
            return new NextResponse("Assignment not found", { status: 404 });
        }

        // Update to REJECTED
        await prisma.cleanerAssignment.update({
            where: { id },
            data: {
                status: AssignmentStatus.REJECTED,
                rejectedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Reject job error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
