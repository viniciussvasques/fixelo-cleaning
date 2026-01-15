'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Plus,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface Ticket {
    id: string;
    subject: string;
    category: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
    messages: {
        id: string;
        content: string;
        isStaff: boolean;
        createdAt: string;
    }[];
}

const statusConfig = {
    OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const categoryOptions = [
    { value: 'BOOKING', label: 'Booking Issue' },
    { value: 'PAYMENT', label: 'Payment Issue' },
    { value: 'CLEANER', label: 'Cleaner Issue' },
    { value: 'REFUND', label: 'Refund Request' },
    { value: 'OTHER', label: 'Other' },
];

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // New ticket form
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('BOOKING');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/support/tickets');
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch {
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const createTicket = async () => {
        if (!subject.trim() || !description.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, category, description })
            });

            if (res.ok) {
                toast.success('Ticket created successfully!');
                setShowNewTicket(false);
                setSubject('');
                setCategory('BOOKING');
                setDescription('');
                fetchTickets();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to create ticket');
            }
        } catch {
            toast.error('Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });

            if (res.ok) {
                setNewMessage('');
                // Refresh ticket
                const ticketRes = await fetch(`/api/support/tickets/${selectedTicket.id}`);
                if (ticketRes.ok) {
                    const data = await ticketRes.json();
                    setSelectedTicket(data.ticket);
                    setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
                }
            }
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Show ticket detail
    if (selectedTicket) {
        const status = statusConfig[selectedTicket.status];
        const StatusIcon = status.icon;

        return (
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h1>
                        <p className="text-sm text-gray-500">Ticket #{selectedTicket.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                    </span>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-xl border p-4 mb-4 max-h-[400px] overflow-y-auto space-y-4">
                    {selectedTicket.messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.isStaff ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.isStaff
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-blue-600 text-white'
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.isStaff ? 'text-gray-500' : 'text-blue-100'}`}>
                                    {msg.isStaff ? 'Support Team' : 'You'} • {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={submitting || !newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Show new ticket form
    if (showNewTicket) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setShowNewTicket(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">New Support Ticket</h1>
                </div>

                <div className="bg-white rounded-xl border p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3"
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief description of your issue"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please describe your issue in detail..."
                            rows={5}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3"
                        />
                    </div>

                    <button
                        onClick={createTicket}
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>Submit Ticket</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Ticket list
    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support</h1>
                    <p className="text-gray-500">Get help with your bookings</p>
                </div>
                <button
                    onClick={() => setShowNewTicket(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Ticket
                </button>
            </div>

            {/* Tickets */}
            {tickets.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No support tickets</h2>
                    <p className="text-gray-500 mb-6">
                        Have an issue? Create a support ticket and we'll help you.
                    </p>
                    <button
                        onClick={() => setShowNewTicket(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        Create Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const status = statusConfig[ticket.status];
                        const StatusIcon = status.icon;
                        return (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className="w-full bg-white rounded-xl border p-4 hover:shadow-md transition-shadow text-left flex items-center gap-4"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                                    <StatusIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')} • {ticket.messages.length} messages
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
