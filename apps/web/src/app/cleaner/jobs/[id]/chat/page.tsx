'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

interface ChatData {
    messages: Message[];
    booking: {
        id: string;
        status: string;
        userId: string;
        cleanerId: string;
    };
}

export default function JobChatPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const bookingId = params.id as string;
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [booking, setBooking] = useState<ChatData['booking'] | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/bookings/${bookingId}/messages`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data: ChatData = await res.json();
            setMessages(data.messages);
            setBooking(data.booking);
        } catch (err) {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();
            setMessages(prev => [...prev, data.message]);
            setNewMessage('');
            inputRef.current?.focus();
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="font-semibold">Customer Chat</h1>
                    <p className="text-xs text-gray-500">Booking #{bookingId.slice(0, 8)}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/cleaner/jobs/${bookingId}/execute`}>
                        Back to Job
                    </Link>
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No messages yet</p>
                        <p className="text-sm text-gray-400">Start the conversation with the customer</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                            <div className="flex items-center justify-center mb-4">
                                <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {dateMessages.map(message => {
                                    const isMe = message.sender.id === session?.user?.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                    isMe
                                                        ? 'bg-primary text-white rounded-br-sm'
                                                        : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                                                }`}
                                            >
                                                {!isMe && (
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        {message.sender.firstName}
                                                    </p>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                        maxLength={1000}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
