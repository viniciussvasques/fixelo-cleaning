/**
 * Admin Quality Issues API
 * 
 * List and manage quality issue reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const issueType = searchParams.get('issueType');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (issueType) where.issueType = issueType;

        const issues = await prisma.qualityIssue.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Fetch related data for each issue
        const enrichedIssues = await Promise.all(issues.map(async (issue) => {
            const [reporter, booking] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: issue.userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }),
                prisma.booking.findUnique({
                    where: { id: issue.bookingId },
                    select: {
                        id: true,
                        scheduledDate: true,
                        totalPrice: true,
                        serviceType: { select: { name: true } },
                        assignments: {
                            where: { status: 'ACCEPTED' },
                            include: {
                                cleaner: {
                                    select: {
                                        id: true,
                                        rating: true,
                                        user: {
                                            select: { firstName: true, lastName: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            ]);

            return {
                ...issue,
                reporter,
                booking,
            };
        }));

        return NextResponse.json(enrichedIssues);

    } catch (error) {
        console.error('[AdminQualityIssues] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
    }
}
