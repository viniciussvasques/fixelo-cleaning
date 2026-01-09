import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = params.id;

    try {
        // Update notification to mark as read (using deliveredAt as read timestamp)
        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id // Ensure user owns this notification
            },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date()
            }
        });

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error('[Notification] Mark as read failed:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}
