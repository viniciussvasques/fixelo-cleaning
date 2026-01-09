/**
 * Job Completion API
 * 
 * Called when a cleaner marks a job as complete.
 * Triggers the payout process.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { processJobCompletion } from '@/lib/stripe-connect';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;

        // Verify the cleaner is assigned to this booking
        const cleaner = await prisma.cleanerProfile.findFirst({
            where: { userId: session.user.id },
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Not a cleaner' }, { status: 403 });
        }

        const assignment = await prisma.cleanerAssignment.findFirst({
            where: {
                bookingId,
                cleanerId: cleaner.id,
                status: 'ACCEPTED',
            },
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Not assigned to this job' }, { status: 403 });
        }

        // Get optional completion data
        const body = await request.json().catch(() => ({}));

        // Update booking to COMPLETED
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' },
        });

        // Update cleaner metrics
        await prisma.cleanerProfile.update({
            where: { id: cleaner.id },
            data: {
                totalJobsCompleted: { increment: 1 },
            },
        });

        // Process payout
        const payoutResult = await processJobCompletion(bookingId);

        if (!payoutResult.success) {
            console.error(`[JobComplete] Payout failed for booking ${bookingId}:`, payoutResult.error);
            // Don't fail the request - job is complete, payout can be retried
        }

        return NextResponse.json({
            success: true,
            message: 'Job marked as complete',
            payout: payoutResult.success ? {
                status: 'completed',
                transferId: payoutResult.transferId,
            } : {
                status: 'pending',
                error: payoutResult.error,
            },
        });
    } catch (error) {
        console.error('[JobComplete] Error:', error);
        return NextResponse.json(
            { error: 'Failed to complete job' },
            { status: 500 }
        );
    }
}
