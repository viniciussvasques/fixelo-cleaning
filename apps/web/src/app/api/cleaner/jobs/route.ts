import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus } from '@prisma/client';

// Mock session/auth for MVP
// In real app: const session = await auth(); userId = session.user.id;
const MOCK_USER_ID = "cleaner-user-id";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const userId = searchParams.get('userId') || MOCK_USER_ID; // Allow passing userId for testing

        // Find cleaner profile
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId }
        });

        if (!cleaner) {
            return new NextResponse("Cleaner profile not found", { status: 404 });
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
        console.error('Fetch jobs error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
