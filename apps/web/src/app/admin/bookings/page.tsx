import { prisma } from '@fixelo/database';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, BOOKING_STATUS } from '@/lib/constants';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
    const bookings = await prisma.booking.findMany({
        orderBy: { scheduledDate: 'desc' },
        include: {
            user: true,
            serviceType: true,
            address: true,
            assignments: {
                where: { status: 'ACCEPTED' },
                include: {
                    cleaner: {
                        include: {
                            user: true,
                        },
                    },
                },
                take: 1,
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
                    <p className="text-muted-foreground">
                        View and manage all customer bookings
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="search"
                        placeholder="Search bookings..."
                        className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <select className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            {bookings.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={<Calendar className="w-16 h-16" />}
                        title="No bookings yet"
                        description="Bookings will appear here as customers make reservations"
                    />
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Cleaner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-mono text-xs">
                                            {booking.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{booking.user.firstName} {booking.user.lastName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {booking.user.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{booking.serviceType.name}</TableCell>
                                        <TableCell>
                                            {formatDate(booking.scheduledDate)}
                                            <div className="text-xs text-muted-foreground">
                                                {booking.timeWindow}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {booking.address ? (
                                                <div className="text-sm">
                                                    <div>{booking.address.city}, {booking.address.state}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {booking.assignments && booking.assignments[0] ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">
                                                        {booking.assignments[0].cleaner.user.firstName?.[0] || 'C'}
                                                    </div>
                                                    <span className="text-sm">
                                                        {booking.assignments[0].cleaner.user.firstName} {booking.assignments[0].cleaner.user.lastName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-warning font-medium text-sm">
                                                    Unassigned
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={(BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.variant || 'default') as 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline'}>
                                                {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label || booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(booking.totalPrice)}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/admin/bookings/${booking.id}`}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
