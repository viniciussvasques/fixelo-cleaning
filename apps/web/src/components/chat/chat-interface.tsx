'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMessages, sendMessage } from '@/app/actions/chat';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
    bookingId: string;
    currentUserId: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: {
        firstName: string;
        lastName: string;
    };
}

export function ChatInterface({ bookingId, currentUserId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Poll for messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const msgs = await getMessages(bookingId);
                setMessages(msgs);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5s

        return () => clearInterval(interval);
    }, [bookingId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || loading) return;

        setLoading(true);
        try {
            await sendMessage(bookingId, newMessage);
            setNewMessage('');
            // Refresh immediately
            const msgs = await getMessages(bookingId);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-background shadow-sm">
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                    Message History
                </h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No messages yet. Start the conversation!
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full mb-4",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg p-3",
                                        isMe
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                        <span>{msg.sender.firstName}</span>
                                        <span>
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={loading}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={loading}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
