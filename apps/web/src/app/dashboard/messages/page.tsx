'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    MessageCircle,
    Send,
    Loader2,
    User,
    Calendar,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

interface Conversation {
    bookingId: string;
    serviceName: string;
    scheduledDate: string;
    cleanerName: string;
    cleanerId: string;
    lastMessage?: string;
    lastMessageAt?: string;
    status: string;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.bookingId);
            // Polling for new messages every 5 seconds
            const interval = setInterval(() => {
                fetchMessages(selectedConversation.bookingId, true);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation?.bookingId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                // Filter bookings with assigned cleaners
                const convos: Conversation[] = data.bookings
                    .filter((b: any) => b.assignments?.some((a: any) => a.status === 'ACCEPTED'))
                    .map((b: any) => {
                        const assignment = b.assignments?.find((a: any) => a.status === 'ACCEPTED');
                        return {
                            bookingId: b.id,
                            serviceName: b.serviceType?.name || 'Cleaning',
                            scheduledDate: b.scheduledDate,
                            cleanerName: assignment?.cleaner?.user
                                ? `${assignment.cleaner.user.firstName} ${assignment.cleaner.user.lastName}`
                                : 'Cleaner',
                            cleanerId: assignment?.cleaner?.id,
                            status: b.status,
                        };
                    });
                setConversations(convos);
            }
        } catch {
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (bookingId: string, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chat/${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                // Get current user ID from session
                if (data.messages?.[0]?.senderId) {
                    // We'll detect user by checking who sent the message
                }
            }
        } catch {
            if (!silent) toast.error('Failed to load messages');
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedConversation || !newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/chat/${selectedConversation.bookingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
                setNewMessage('');
                setUserId(data.message.senderId); // Remember current user ID
            } else {
                toast.error('Failed to send message');
            }
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Chat view
    if (selectedConversation) {
        return (
            <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                    <button
                        onClick={() => setSelectedConversation(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold text-gray-900">{selectedConversation.cleanerName}</h2>
                        <p className="text-sm text-gray-500">
                            {selectedConversation.serviceName} • {format(new Date(selectedConversation.scheduledDate), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                    {loadingMessages ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>No messages yet</p>
                            <p className="text-sm">Send a message to your cleaner!</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const isMe = userId === msg.senderId || msg.sender.firstName === 'You';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMe
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {format(new Date(msg.createdAt), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 pt-4 border-t">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white w-12 h-12 rounded-full flex items-center justify-center"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Conversation list
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-500">Chat with your cleaners</p>
            </div>

            {conversations.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h2>
                    <p className="text-gray-500">
                        Once a cleaner accepts your booking, you can message them here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conversations.map(conv => (
                        <button
                            key={conv.bookingId}
                            onClick={() => setSelectedConversation(conv)}
                            className="w-full bg-white rounded-xl border p-4 hover:shadow-md transition-shadow text-left flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">{conv.cleanerName}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {conv.serviceName} • {format(new Date(conv.scheduledDate), 'MMM d')}
                                </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${conv.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    conv.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {conv.status.replace('_', ' ')}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
