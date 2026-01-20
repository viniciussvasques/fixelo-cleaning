'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    AlertTriangle,
    Search,
    Loader2,
    DollarSign,
    RefreshCcw,
    Clock,
    Star,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/constants';

interface QualityIssue {
    id: string;
    issueType: string;
    description: string;
    status: string;
    resolutionType: string | null;
    resolutionDetails: string | null;
    resolvedAt: string | null;
    createdAt: string;
    reporter: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    booking: {
        id: string;
        scheduledDate: string;
        totalPrice: number;
        serviceType: { name: string };
        assignments: Array<{
            cleaner: {
                id: string;
                rating: number;
                user: {
                    firstName: string;
                    lastName: string;
                };
            };
        }>;
    };
}

const STATUS_OPTIONS = ['ALL', 'REPORTED', 'IN_REVIEW', 'RESOLVED_RECLEAN', 'RESOLVED_REFUND_PARTIAL', 'RESOLVED_REFUND_FULL', 'REJECTED'];
const ISSUE_TYPES = ['ALL', 'POOR_QUALITY', 'DAMAGED_PROPERTY', 'NO_SHOW', 'CLEANER_BEHAVIOR', 'OTHER'];

const STATUS_COLORS: Record<string, string> = {
    REPORTED: 'bg-red-100 text-red-700',
    IN_REVIEW: 'bg-yellow-100 text-yellow-700',
    RESOLVED_RECLEAN: 'bg-blue-100 text-blue-700',
    RESOLVED_REFUND_PARTIAL: 'bg-green-100 text-green-700',
    RESOLVED_REFUND_FULL: 'bg-green-100 text-green-700',
    REJECTED: 'bg-gray-100 text-gray-700',
};

export default function QualityIssuesPage() {
    const [issues, setIssues] = useState<QualityIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(null);
    const [resolution, setResolution] = useState({ type: '', details: '', refundAmount: 0 });
    const [submitting, setSubmitting] = useState(false);

    const fetchIssues = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);
            if (typeFilter !== 'ALL') params.set('issueType', typeFilter);

            const res = await fetch(`/api/admin/quality-issues?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch issues');
            const data = await res.json();
            setIssues(data);
        } catch {
            toast.error('Failed to load quality issues');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    const handleResolve = async () => {
        if (!selectedIssue || !resolution.type) {
            toast.error('Please select a resolution type');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/quality-issues/${selectedIssue.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resolution),
            });

            if (!res.ok) throw new Error('Failed to resolve issue');

            toast.success('Issue resolved successfully');
            setSelectedIssue(null);
            setResolution({ type: '', details: '', refundAmount: 0 });
            fetchIssues();
        } catch {
            toast.error('Failed to resolve issue');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredIssues = issues.filter(issue => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            (issue.reporter?.email || '').toLowerCase().includes(searchLower) ||
            `${issue.reporter?.firstName || ''} ${issue.reporter?.lastName || ''}`.toLowerCase().includes(searchLower)
        );
    });

    // Stats
    const reportedCount = issues.filter(i => i.status === 'REPORTED').length;
    const inReviewCount = issues.filter(i => i.status === 'IN_REVIEW').length;
    const totalRefunded = issues
        .filter(i => i.status.includes('REFUND'))
        .reduce((sum, i) => sum + (i.booking?.totalPrice || 0), 0);

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
            <div>
                <h1 className="text-3xl font-bold">Quality Issues</h1>
                <p className="text-muted-foreground">Review and resolve customer complaints</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={reportedCount > 0 ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={`w-8 h-8 ${reportedCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-2xl font-bold">{reportedCount}</p>
                                <p className="text-xs text-muted-foreground">New Reports</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold">{inReviewCount}</p>
                                <p className="text-xs text-muted-foreground">In Review</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <RefreshCcw className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{issues.filter(i => i.status === 'RESOLVED_RECLEAN').length}</p>
                                <p className="text-xs text-muted-foreground">Re-cleans</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalRefunded)}</p>
                                <p className="text-xs text-muted-foreground">Total Refunded</p>
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
                                    placeholder="Search by customer name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status === 'ALL' ? 'All Status' : status.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Issue Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {ISSUE_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Issues Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Booking</TableHead>
                                <TableHead>Issue Type</TableHead>
                                <TableHead>Cleaner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reported</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIssues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No quality issues found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <TableRow key={issue.id}>
                                        <TableCell>
                                            <div className="font-medium">{issue.reporter?.firstName || 'Unknown'} {issue.reporter?.lastName || ''}</div>
                                            <div className="text-xs text-muted-foreground">{issue.reporter?.email || 'No email'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{issue.booking?.serviceType?.name || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">{formatCurrency(issue.booking?.totalPrice || 0)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{issue.issueType.replace(/_/g, ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {issue.booking?.assignments?.[0]?.cleaner?.user ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">
                                                        {issue.booking.assignments[0].cleaner.user.firstName}
                                                    </span>
                                                    <span className="flex items-center text-xs text-yellow-600">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {issue.booking.assignments[0].cleaner.rating?.toFixed(1) || 'N/A'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">No assignment</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[issue.status]}>{issue.status.replace(/_/g, ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant={issue.status === 'REPORTED' ? 'default' : 'outline'}
                                                onClick={() => setSelectedIssue(issue)}
                                            >
                                                {issue.status === 'REPORTED' ? 'Review' : 'View'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Resolution Dialog */}
            <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedIssue && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Quality Issue Review</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Issue Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Customer</p>
                                        <p className="font-medium">{selectedIssue.reporter?.firstName || 'Unknown'} {selectedIssue.reporter?.lastName || ''}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Booking Value</p>
                                        <p className="font-medium">{formatCurrency(selectedIssue.booking?.totalPrice || 0)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Issue Type</p>
                                    <Badge variant="outline" className="text-sm">{selectedIssue.issueType.replace(/_/g, ' ')}</Badge>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Customer Description</p>
                                    <p className="text-sm bg-slate-50 p-4 rounded-lg">{selectedIssue.description}</p>
                                </div>

                                {/* Cleaner Info */}
                                {selectedIssue.booking?.assignments?.[0]?.cleaner?.user && (
                                    <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Cleaner</p>
                                                <p className="font-medium">
                                                    {selectedIssue.booking.assignments[0].cleaner.user.firstName} {selectedIssue.booking.assignments[0].cleaner.user.lastName}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-600">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="font-medium">{selectedIssue.booking.assignments[0].cleaner.rating?.toFixed(1) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Resolution Form */}
                                {selectedIssue.status === 'REPORTED' || selectedIssue.status === 'IN_REVIEW' ? (
                                    <div className="border-t pt-4 space-y-4">
                                        <h4 className="font-semibold">Resolution</h4>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Resolution Type</p>
                                            <Select value={resolution.type} onValueChange={(v) => setResolution(prev => ({ ...prev, type: v }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select resolution..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="RECLEAN">Schedule Free Re-clean</SelectItem>
                                                    <SelectItem value="PARTIAL_REFUND">Partial Refund (30%)</SelectItem>
                                                    <SelectItem value="FULL_REFUND">Full Refund</SelectItem>
                                                    <SelectItem value="REJECTED">Reject Claim</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {resolution.type && resolution.type.includes('REFUND') && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">Refund Amount</p>
                                                <Input
                                                    type="number"
                                                    value={resolution.type === 'FULL_REFUND' ? (selectedIssue.booking?.totalPrice || 0) : resolution.refundAmount}
                                                    onChange={(e) => setResolution(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) }))}
                                                    disabled={resolution.type === 'FULL_REFUND'}
                                                />
                                                {resolution.type === 'PARTIAL_REFUND' && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Suggested: {formatCurrency((selectedIssue.booking?.totalPrice || 0) * 0.3)} (30%)
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-sm font-medium mb-2">Resolution Notes</p>
                                            <Textarea
                                                placeholder="Add notes about the resolution..."
                                                value={resolution.details}
                                                onChange={(e) => setResolution(prev => ({ ...prev, details: e.target.value }))}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-800">Resolved</p>
                                        <p className="text-sm text-green-700">{selectedIssue.resolutionDetails}</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedIssue(null)}>
                                    Cancel
                                </Button>
                                {(selectedIssue.status === 'REPORTED' || selectedIssue.status === 'IN_REVIEW') && (
                                    <Button onClick={handleResolve} disabled={submitting || !resolution.type}>
                                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Resolve Issue
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
