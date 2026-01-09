import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // In production: verify cleaner owns the assignment or is eligible
        // For MVP assuming assignment ID is passed or Job ID
        // The URL is /cleaner/jobs/[id]. [id] is effectively the Assignment ID for the cleaner perspective.
        // Let's verify. Dashboard lists CleanerAssignments. So 'id' is likely CleanerAssignment.id.
        // Let's check dashboard again.
        // Dashboard uses `jobs.map(job => job.id)`. And GET /api/cleaner/jobs returns `prisma.cleanerAssignment.findMany`.
        // So yes, `id` IS the `CleanerAssignment.id`.

        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        serviceType: true,
                        address: true,
                        addOns: {
                            include: {
                                addOn: true
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return new NextResponse("Job assignment not found", { status: 404 });
        }

        return NextResponse.json(assignment);

    } catch (error) {
        console.error('Fetch job details error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
