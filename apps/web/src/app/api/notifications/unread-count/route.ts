/**
 * Notifications Unread Count API
 * 
 * Returns the count of unread notifications for the current user
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 });
        }

        // Count recent notifications (last 7 days, SENT status)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                status: 'SENT',
                sentAt: { gte: sevenDaysAgo }
            }
        });

        return NextResponse.json({ count });

    } catch (error) {
        console.error('[Notifications] Unread count error:', error);
        return NextResponse.json({ count: 0 });
    }
}
