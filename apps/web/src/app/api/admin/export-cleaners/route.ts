/**
 * Export Cleaners to CSV
 * 
 * Exports cleaner list with filters applied
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CleanerStatus } from '@prisma/client';
import { prisma } from '@fixelo/database';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || '';

        // Build filter
        const where: { status?: CleanerStatus; onboardingCompleted?: boolean } = {};

        if (status === 'pending') {
            where.status = CleanerStatus.PENDING_APPROVAL;
        } else if (status === 'active') {
            where.status = CleanerStatus.ACTIVE;
        } else if (status === 'incomplete') {
            where.onboardingCompleted = false;
        }

        const cleaners = await prisma.cleanerProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Build CSV
        const headers = [
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Status',
            'Onboarding Step',
            'Onboarding Completed',
            'Verification Status',
            'Rating',
            'Jobs Completed',
            'Created At',
        ];

        const rows = cleaners.map(c => [
            c.user.firstName,
            c.user.lastName,
            c.user.email,
            c.user.phone || '',
            c.status,
            c.onboardingStep,
            c.onboardingCompleted ? 'Yes' : 'No',
            c.verificationStatus,
            c.rating,
            c.jobsCompleted,
            c.createdAt.toISOString(),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Return as downloadable file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="cleaners-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('[Export Cleaners] Error:', error);
        return NextResponse.json(
            { error: 'Failed to export cleaners' },
            { status: 500 }
        );
    }
}
