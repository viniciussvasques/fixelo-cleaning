'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Notification {
    id: string;
    type: string;
    subject: string | null;
    body: string;
    createdAt: string;
}

interface SSEMessage {
    type: 'connected' | 'notifications' | 'heartbeat';
    userId?: string;
    count?: number;
    items?: Notification[];
}

/**
 * Hook for real-time notifications via SSE
 */
export function useRealTimeNotifications() {
    const { data: session } = useSession();
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const connect = useCallback(() => {
        if (!session?.user) return;

        const eventSource = new EventSource('/api/notifications/stream');

        eventSource.onopen = () => {
            setConnected(true);
            console.log('[SSE] Connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data: SSEMessage = JSON.parse(event.data);

                if (data.type === 'notifications' && data.items) {
                    setNotifications(data.items);
                    setUnreadCount(data.count || 0);

                    // Show toast for new notifications
                    if (data.items.length > 0) {
                        const latest = data.items[0];
                        toast.info(latest.subject || 'New notification', {
                            description: latest.body.substring(0, 100),
                        });
                    }
                }
            } catch (error) {
                console.error('[SSE] Parse error:', error);
            }
        };

        eventSource.onerror = () => {
            setConnected(false);
            console.log('[SSE] Disconnected, reconnecting...');
            eventSource.close();
            // Reconnect after 5 seconds
            setTimeout(connect, 5000);
        };

        return () => {
            eventSource.close();
        };
    }, [session?.user]);

    useEffect(() => {
        const cleanup = connect();
        return cleanup;
    }, [connect]);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
            });
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[Notifications] Mark as read failed:', error);
        }
    }, []);

    return {
        connected,
        notifications,
        unreadCount,
        markAsRead,
    };
}
