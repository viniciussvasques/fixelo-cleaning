'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    HelpCircle, 
    Loader2, 
    ChevronRight, 
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Ticket {
    id: string;
    ticketNumber: string;
    category: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    messages: { id: string }[];
}

const STATUS_CONFIG = {
    OPEN: { label: 'Open', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
    WAITING_CUSTOMER: { label: 'Waiting for You', color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
    WAITING_CLEANER: { label: 'Waiting for Reply', color: 'bg-orange-100 text-orange-700', icon: Clock },
    RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
    BOOKING_ISSUE: 'Booking',
    PAYMENT_ISSUE: 'Payment',
    CLEANER_COMPLAINT: 'Complaint',
    CUSTOMER_COMPLAINT: 'Customer',
    SERVICE_QUALITY: 'Quality',
    TECHNICAL_ISSUE: 'Technical',
    ACCOUNT_ISSUE: 'Account',
    OTHER: 'Other',
};

export default function CleanerSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        try {
            let url = '/api/support/tickets?limit=50';
            if (filter === 'open') {
                url += '&status=OPEN,IN_PROGRESS,WAITING_CUSTOMER,WAITING_CLEANER';
            } else if (filter === 'closed') {
                url += '&status=RESOLVED,CLOSED';
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTickets(data.tickets);
        } catch (err) {
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Support</h1>
                    <p className="text-gray-500">Get help with your jobs and account</p>
                </div>
                <Button asChild>
                    <Link href="/cleaner/support/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                    </Link>
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'open', 'closed'] as const).map(f => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <HelpCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="font-semibold text-lg">No tickets found</h3>
                        <p className="text-gray-500 mt-1">
                            {filter === 'all' 
                                ? "You haven't created any support tickets yet"
                                : `No ${filter} tickets`
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.OPEN;
                        const StatusIcon = statusConfig.icon;

                        return (
                            <Link key={ticket.id} href={`/cleaner/support/${ticket.ticketNumber}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.color}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                                                    </Badge>
                                                    <span className="text-xs text-gray-400">{ticket.ticketNumber}</span>
                                                </div>
                                                <h3 className="font-medium truncate">{ticket.subject}</h3>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                    <Badge className={`${statusConfig.color} text-xs`}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                    <span>{formatDate(ticket.updatedAt)}</span>
                                                    {ticket.messages.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {ticket.messages.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Quick Help */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-blue-800">Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Link href="/cleaner/help/cancellation" className="block p-3 bg-white rounded-lg hover:bg-gray-50">
                        <span className="font-medium">Cancellation Policy</span>
                    </Link>
                    <Link href="/cleaner/help/payments" className="block p-3 bg-white rounded-lg hover:bg-gray-50">
                        <span className="font-medium">Payment & Payouts</span>
                    </Link>
                    <Link href="/cleaner/help/safety" className="block p-3 bg-white rounded-lg hover:bg-gray-50">
                        <span className="font-medium">Safety Guidelines</span>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
