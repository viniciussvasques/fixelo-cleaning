/**
 * Job Checklist API
 * 
 * Handles updating checklist items during job execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

interface Props {
    params: { id: string };
}

/**
 * PATCH - Update checklist item(s)
 */
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;
        const body = await request.json();
        const { itemId, completed, notes, items } = body;

        // Verify cleaner is assigned
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const jobExecution = await prisma.jobExecution.findUnique({
            where: { bookingId },
            include: { checklist: true }
        });

        if (!jobExecution) {
            return NextResponse.json({ error: 'Job execution not found' }, { status: 404 });
        }

        if (jobExecution.cleanerId !== cleaner.id) {
            return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
        }

        // Batch update multiple items
        if (items && Array.isArray(items)) {
            const updates = items.map((item: { id: string; completed: boolean; notes?: string }) => {
                return prisma.jobChecklistItem.update({
                    where: { id: item.id },
                    data: {
                        completed: item.completed,
                        completedAt: item.completed ? new Date() : null,
                        notes: item.notes
                    }
                });
            });

            await prisma.$transaction(updates);

            // Check if all items are completed
            const allCompleted = await prisma.jobChecklistItem.count({
                where: {
                    jobExecutionId: jobExecution.id,
                    completed: false
                }
            });

            if (allCompleted === 0) {
                await prisma.jobExecution.update({
                    where: { id: jobExecution.id },
                    data: { checklistCompletedAt: new Date() }
                });
            }

            return NextResponse.json({ 
                success: true, 
                message: `${items.length} items updated` 
            });
        }

        // Single item update
        if (itemId) {
            const item = await prisma.jobChecklistItem.findUnique({
                where: { id: itemId }
            });

            if (!item || item.jobExecutionId !== jobExecution.id) {
                return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
            }

            await prisma.jobChecklistItem.update({
                where: { id: itemId },
                data: {
                    completed: completed ?? item.completed,
                    completedAt: completed ? new Date() : null,
                    notes: notes ?? item.notes
                }
            });

            // Check if all items are completed
            const allCompleted = await prisma.jobChecklistItem.count({
                where: {
                    jobExecutionId: jobExecution.id,
                    completed: false
                }
            });

            if (allCompleted === 0) {
                await prisma.jobExecution.update({
                    where: { id: jobExecution.id },
                    data: { checklistCompletedAt: new Date() }
                });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'No item specified' }, { status: 400 });

    } catch (error) {
        console.error('[Checklist] PATCH error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to update checklist' 
        }, { status: 500 });
    }
}
