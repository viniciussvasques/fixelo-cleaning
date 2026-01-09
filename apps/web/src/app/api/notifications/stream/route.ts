/**
 * Real-time Notifications API (Server-Sent Events)
 * 
 * Provides real-time updates to clients via SSE.
 * Use cases:
 * - Job status updates for customers
 * - New job offers for cleaners
 * - Payment confirmations
 */

import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`)
            );

            // Poll for new notifications every 5 seconds
            const interval = setInterval(async () => {
                try {
                    // Get pending/sent notifications
                    const notifications = await prisma.notification.findMany({
                        where: {
                            userId,
                            status: { in: ['PENDING', 'SENT'] },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    });

                    if (notifications.length > 0) {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: 'notifications',
                                    count: notifications.length,
                                    items: notifications.map((n) => ({
                                        id: n.id,
                                        type: n.type,
                                        subject: n.subject,
                                        body: n.body,
                                        createdAt: n.createdAt,
                                    })),
                                })}\n\n`
                            )
                        );
                    }

                    // Send heartbeat
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch (error) {
                    console.error('[SSE] Error fetching notifications:', error);
                }
            }, 5000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
