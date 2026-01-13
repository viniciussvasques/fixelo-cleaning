'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    DollarSign,
    Search,
    Loader2,
    TrendingUp,
    Clock,
    CheckCircle,
    Download,
    Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCurrency } from '@/lib/constants';

interface PayoutRecord {
    id: string;
    cleanerId: string;
    cleaner: {
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
        stripeAccountId: string;
    };
    bookingId: string;
    booking: {
        scheduledDate: string;
        totalPrice: number;
        serviceType: { name: string };
    };
    amount: number;
    platformFee: number;
    insuranceFee: number;
    stripeFee: number;
    status: string;
    stripeTransferId: string | null;
    paidAt: string | null;
    createdAt: string;
}

interface PayoutStats {
    totalPending: number;
    totalPendingCount: number;
    totalPaidThisWeek: number;
    totalPaidThisMonth: number;
    avgPayoutAmount: number;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    HELD: 'bg-gray-100 text-gray-700',
};

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
    const [stats, setStats] = useState<PayoutStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [processing, setProcessing] = useState(false);

    const fetchPayouts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);

            const res = await fetch(`/api/admin/payouts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPayouts(data.payouts || []);
        } catch {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/payouts/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (_error) {
            console.error('Failed to fetch stats:', _error);
        }
    }, []);

    useEffect(() => {
        fetchPayouts();
        fetchStats();
    }, [fetchPayouts, fetchStats]);

    const processPayouts = async () => {
        if (!confirm('Process all pending payouts now?')) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/admin/payouts/process', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to process');
            const data = await res.json();
            toast.success(`Processed ${data.processed} payouts successfully`);
            fetchPayouts();
            fetchStats();
        } catch {
            toast.error('Failed to process payouts');
        } finally {
            setProcessing(false);
        }
    };

    const filteredPayouts = payouts.filter(payout => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            payout.cleaner.user.email.toLowerCase().includes(searchLower) ||
            `${payout.cleaner.user.firstName} ${payout.cleaner.user.lastName}`.toLowerCase().includes(searchLower)
        );
    });

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
                    <h1 className="text-3xl font-bold">Payouts</h1>
                    <p className="text-muted-foreground">Manage cleaner earnings and payouts</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={processPayouts} disabled={processing || !stats?.totalPendingCount}>
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                        Process Payouts ({stats?.totalPendingCount || 0})
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={stats?.totalPendingCount ? 'border-yellow-200 bg-yellow-50' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className={`w-8 h-8 ${stats?.totalPendingCount ? 'text-yellow-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.totalPending || 0)}</p>
                                <p className="text-xs text-muted-foreground">Pending ({stats?.totalPendingCount || 0} payouts)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.totalPaidThisWeek || 0)}</p>
                                <p className="text-xs text-muted-foreground">Paid This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.totalPaidThisMonth || 0)}</p>
                                <p className="text-xs text-muted-foreground">Paid This Month</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.avgPayoutAmount || 0)}</p>
                                <p className="text-xs text-muted-foreground">Avg. Payout</p>
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
                                    placeholder="Search by cleaner name or email..."
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
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="HELD">Held</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payouts Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cleaner</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Booking Total</TableHead>
                                <TableHead>Cleaner Payout</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayouts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No payouts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                                                    {payout.cleaner.user.firstName?.[0]}{payout.cleaner.user.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{payout.cleaner.user.firstName} {payout.cleaner.user.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{payout.cleaner.user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{payout.booking.serviceType.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(payout.booking.scheduledDate), 'MMM d, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(payout.booking.totalPrice)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-green-600">{formatCurrency(payout.amount)}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Fees: {formatCurrency(payout.platformFee + payout.insuranceFee)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[payout.status]}>{payout.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {payout.paidAt
                                                    ? format(new Date(payout.paidAt), 'MMM d, yyyy')
                                                    : formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
