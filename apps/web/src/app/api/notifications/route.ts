import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get notifications for current user
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
            id: true,
            type: true,
            subject: true,
            body: true,
            status: true,
            metadata: true,
            createdAt: true,
            sentAt: true,
        }
    });

    // Transform to match expected interface
    const transformed = notifications.map(n => ({
        id: n.id,
        type: (n.metadata as any)?.type || 'DEFAULT',
        title: n.subject || 'Notification',
        body: n.body,
        read: n.status === 'DELIVERED',
        data: n.metadata as Record<string, string> | undefined,
        createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: transformed });
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds, markAll } = await req.json();

    if (markAll) {
        await prisma.notification.updateMany({
            where: { userId: session.user.id },
            data: { status: 'DELIVERED', deliveredAt: new Date() }
        });
    } else if (notificationIds?.length) {
        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: session.user.id
            },
            data: { status: 'DELIVERED', deliveredAt: new Date() }
        });
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds, deleteAll } = await req.json();

    if (deleteAll) {
        await prisma.notification.deleteMany({
            where: { userId: session.user.id }
        });
    } else if (notificationIds?.length) {
        await prisma.notification.deleteMany({
            where: {
                id: { in: notificationIds },
                userId: session.user.id
            }
        });
    }

    return NextResponse.json({ success: true });
}
