'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
    createdAt: string;
    read: boolean;
}

interface UseBookingChatReturn {
    messages: Message[];
    loading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<boolean>;
    refreshMessages: () => Promise<void>;
}

/**
 * Hook for booking chat functionality
 */
export function useBookingChat(bookingId: string): UseBookingChatReturn {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshMessages = useCallback(async () => {
        if (!bookingId) return;

        try {
            const response = await fetch(`/api/chat/${bookingId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            setMessages(data.messages || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    const sendMessage = useCallback(
        async (content: string): Promise<boolean> => {
            if (!bookingId || !content.trim()) return false;

            try {
                const response = await fetch(`/api/chat/${bookingId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                const data = await response.json();
                setMessages((prev) => [...prev, data.message]);
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                return false;
            }
        },
        [bookingId]
    );

    // Initial load
    useEffect(() => {
        refreshMessages();
    }, [refreshMessages]);

    // Poll for new messages every 10 seconds
    useEffect(() => {
        const interval = setInterval(refreshMessages, 10000);
        return () => clearInterval(interval);
    }, [refreshMessages]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        refreshMessages,
    };
}

/**
 * Check if message is from current user
 */
export function isOwnMessage(message: Message, userId?: string): boolean {
    return message.senderId === userId;
}
