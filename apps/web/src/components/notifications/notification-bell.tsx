'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRealTimeNotifications } from '@/hooks/use-realtime-notifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, connected } = useRealTimeNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600" />

                {/* Connection indicator */}
                <span
                    className={`absolute top-1 right-1 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                />

                {/* Unread count badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-gray-500">{unreadCount} unread</span>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                {notification.subject && (
                                                    <p className="font-medium text-sm text-gray-900 truncate">
                                                        {notification.subject}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {notification.body}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                            <button
                                className="text-sm text-primary font-medium hover:underline w-full text-center"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
