'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Bell, Loader2, CheckCheck, Briefcase, DollarSign,
    Calendar, AlertCircle, Star, MessageSquare, Trash2,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    data?: Record<string, string>;
    createdAt: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
    NEW_JOB: Briefcase,
    JOB_CANCELLED: AlertCircle,
    JOB_REMINDER: Calendar,
    PAYOUT: DollarSign,
    REVIEW: Star,
    MESSAGE: MessageSquare,
    DEFAULT: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
    NEW_JOB: 'bg-green-100 text-green-600',
    JOB_CANCELLED: 'bg-red-100 text-red-600',
    JOB_REMINDER: 'bg-blue-100 text-blue-600',
    PAYOUT: 'bg-emerald-100 text-emerald-600',
    REVIEW: 'bg-amber-100 text-amber-600',
    MESSAGE: 'bg-purple-100 text-purple-600',
    DEFAULT: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Polling automático a cada 30 segundos
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch {
            // Ignore errors
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch {
            toast.error('Failed to delete notification');
        }
    };

    const getNotificationLink = (notification: Notification): string | null => {
        if (notification.data?.bookingId) {
            return `/cleaner/jobs/${notification.data.bookingId}`;
        }
        if (notification.data?.assignmentId) {
            return `/cleaner/jobs/${notification.data.assignmentId}`;
        }
        if (notification.type === 'PAYOUT') {
            return '/cleaner/earnings';
        }
        return null;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            {notifications.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-sm text-green-600 font-medium"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                </div>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">No Notifications</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        You're all caught up! New job opportunities and updates will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => {
                        const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.DEFAULT;
                        const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.DEFAULT;
                        const link = getNotificationLink(notification);

                        const Content = (
                            <div
                                className={`bg-white rounded-xl p-4 border transition-all ${notification.read
                                    ? 'border-gray-100'
                                    : 'border-green-200 bg-green-50/50 shadow-sm'
                                    }`}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className={`font-semibold text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className={`text-sm mt-0.5 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                                                    {notification.body}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {link && (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );

                        if (link) {
                            return (
                                <Link key={notification.id} href={link}>
                                    {Content}
                                </Link>
                            );
                        }

                        return <div key={notification.id}>{Content}</div>;
                    })}
                </div>
            )}

            {/* Push Notifications Prompt */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-800">Enable Push Notifications</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Never miss a job opportunity! Enable notifications to get instant alerts for new jobs.
                        </p>
                        <button
                            onClick={async () => {
                                if ('Notification' in window) {
                                    const permission = await Notification.requestPermission();
                                    if (permission === 'granted') {
                                        toast.success('Notifications enabled!');
                                    } else {
                                        toast.error('Permission denied');
                                    }
                                } else {
                                    toast.error('Notifications not supported');
                                }
                            }}
                            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Enable Notifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
