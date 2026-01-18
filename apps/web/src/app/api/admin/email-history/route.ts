/**
 * Admin Email History API
 * 
 * Returns email logs for a specific cleaner
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@fixelo/database';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const cleanerId = searchParams.get('cleanerId');

        if (!cleanerId) {
            return NextResponse.json({ error: 'cleanerId required' }, { status: 400 });
        }

        // Get the cleaner's userId from cleanerId
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { id: cleanerId },
            select: { userId: true },
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
        }

        // Get email logs for this user
        const emails = await prisma.emailLog.findMany({
            where: { userId: cleaner.userId },
            orderBy: { sentAt: 'desc' },
            take: 20,
            select: {
                id: true,
                type: true,
                subject: true,
                recipient: true,
                status: true,
                sentAt: true,
            },
        });

        return NextResponse.json({ emails });
    } catch (error) {
        console.error('[Admin Email History] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email history' },
            { status: 500 }
        );
    }
}
