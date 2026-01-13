'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    TicketIcon,
    Search,
    Filter,
    Loader2,
    MessageSquare,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    source: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    booking?: {
        id: string;
        scheduledDate: string;
    } | null;
    _count?: {
        messages: number;
    };
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CATEGORY_OPTIONS = ['ALL', 'BOOKING_ISSUE', 'CUSTOMER_PROBLEM', 'PAYMENT_ISSUE', 'PROPERTY_ISSUE', 'APP_PROBLEM', 'OTHER'];

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
};

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);
            if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);

            const res = await fetch(`/api/admin/support-tickets?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            toast.error('Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !reply.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: reply,
                    newStatus: newStatus || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to send reply');

            toast.success('Reply sent successfully');
            setReply('');
            setNewStatus('');
            setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            ticket.subject.toLowerCase().includes(searchLower) ||
            ticket.user.email.toLowerCase().includes(searchLower) ||
            `${ticket.user.firstName} ${ticket.user.lastName}`.toLowerCase().includes(searchLower)
        );
    });

    // Stats
    const openCount = tickets.filter(t => t.status === 'OPEN').length;
    const urgentCount = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'CLOSED').length;
    const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage customer and cleaner support requests</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={openCount > 0 ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TicketIcon className={`w-8 h-8 ${openCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-2xl font-bold">{openCount}</p>
                                <p className="text-xs text-muted-foreground">Open Tickets</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={urgentCount > 0 ? 'border-orange-200 bg-orange-50' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={`w-8 h-8 ${urgentCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-2xl font-bold">{urgentCount}</p>
                                <p className="text-xs text-muted-foreground">Urgent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold">{inProgressCount}</p>
                                <p className="text-xs text-muted-foreground">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
                                <p className="text-xs text-muted-foreground">Resolved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by subject, name, or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status === 'ALL' ? 'All Status' : status.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITY_OPTIONS.map(priority => (
                                    <SelectItem key={priority} value={priority}>
                                        {priority === 'ALL' ? 'All Priority' : priority}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tickets found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedTicket(ticket)}>
                                        <TableCell>
                                            <div className="font-medium">{ticket.subject}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                                                    {ticket.user.firstName?.[0]}{ticket.user.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{ticket.user.firstName} {ticket.user.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{ticket.user.role}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{ticket.category.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                                        <DialogDescription className="flex items-center gap-2 mt-1">
                                            <Badge className={STATUS_COLORS[selectedTicket.status]}>{selectedTicket.status}</Badge>
                                            <Badge className={PRIORITY_COLORS[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                                            <span className="text-xs">#{selectedTicket.id.slice(0, 8)}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                {/* User Info */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{selectedTicket.user.email} • {selectedTicket.user.role}</p>
                                    </div>
                                </div>

                                {/* Booking Link */}
                                {selectedTicket.booking && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <ExternalLink className="w-4 h-4" />
                                        <a href={`/admin/bookings/${selectedTicket.booking.id}`} className="text-primary hover:underline">
                                            Related Booking - {new Date(selectedTicket.booking.scheduledDate).toLocaleDateString()}
                                        </a>
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{selectedTicket.description}</p>
                                </div>

                                {/* Reply Section */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Reply</h4>
                                    <Textarea
                                        placeholder="Write your response..."
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        rows={4}
                                    />

                                    <div className="flex items-center gap-4 mt-3">
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Change status..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                                <SelectItem value="CLOSED">Closed</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button onClick={handleReply} disabled={submitting || !reply.trim()}>
                                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                            Send Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
