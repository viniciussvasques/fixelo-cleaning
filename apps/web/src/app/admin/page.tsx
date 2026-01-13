import { prisma } from '@fixelo/database';
import Link from 'next/link';
import {
    DollarSign,
    Users,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    Package,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, BOOKING_STATUS } from '@/lib/constants';
import { BookingStatus } from '@prisma/client';
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';


export default async function AdminDashboard() {
    // Calculate date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Fetch current period stats
    const [bookingsCount, usersCount, cleanersCount, revenue] = await Promise.all([
        prisma.booking.count(),
        prisma.user.count(),
        prisma.cleanerProfile.count(),
        prisma.booking.aggregate({
            where: { status: BookingStatus.COMPLETED },
            _sum: { totalPrice: true },
        }),
    ]);

    // Fetch previous period stats for trends
    const [
        previousBookingsCount,
        previousUsersCount,
        recentRevenue,
        previousRevenue,
        recentBookings
    ] = await Promise.all([
        prisma.booking.count({
            where: {
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                }
            }
        }),
        prisma.user.count({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo
                }
            }
        }),
        prisma.booking.aggregate({
            where: {
                status: BookingStatus.COMPLETED,
                createdAt: { gte: thirtyDaysAgo }
            },
            _sum: { totalPrice: true }
        }),
        prisma.booking.aggregate({
            where: {
                status: BookingStatus.COMPLETED,
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                }
            },
            _sum: { totalPrice: true }
        }),
        prisma.booking.count({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            }
        })
    ]);

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { value: '0%', direction: 'up' as const };
        const percent = ((current - previous) / previous) * 100;
        return {
            value: `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`,
            direction: percent >= 0 ? 'up' as const : 'down' as const
        };
    };

    const revenueTrend = calculateTrend(
        recentRevenue._sum.totalPrice || 0,
        previousRevenue._sum.totalPrice || 0
    );

    const usersTrend = calculateTrend(usersCount, previousUsersCount);

    const bookingsTrend = calculateTrend(recentBookings, previousBookingsCount);

    const stats = [
        {
            title: 'Total Revenue',
            value: formatCurrency(revenue._sum.totalPrice || 0),
            icon: <DollarSign className="w-6 h-6" />,
            trend: revenueTrend,
        },
        {
            title: 'Total Users',
            value: usersCount,
            icon: <Users className="w-6 h-6" />,
            trend: usersTrend,
        },
        {
            title: 'Active Cleaners',
            value: cleanersCount,
            icon: <Package className="w-6 h-6" />,
        },
        {
            title: 'Total Bookings',
            value: bookingsCount,
            icon: <Calendar className="w-6 h-6" />,
            trend: bookingsTrend,
        },
    ];

    // Recent bookings
    const recentBookingsData = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            user: true,
            serviceType: true,
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
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here&apos;s what&apos;s happening with your business.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/admin/bookings"
                    className="group card p-6 hover:shadow-lg hover:border-primary/30 transition-all flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-primary">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Manage Bookings</h3>
                        <p className="text-sm text-muted-foreground">View and manage all bookings</p>
                    </div>
                </Link>

                <Link
                    href="/admin/users"
                    className="group card p-6 hover:shadow-lg hover:border-primary/30 transition-all flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-accent">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Manage Users</h3>
                        <p className="text-sm text-muted-foreground">View customers and cleaners</p>
                    </div>
                </Link>

                <Link
                    href="/admin/analytics"
                    className="group card p-6 hover:shadow-lg hover:border-primary/30 transition-all flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-info">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">View Analytics</h3>
                        <p className="text-sm text-muted-foreground">Check performance metrics</p>
                    </div>
                </Link>
            </div>

            {/* Recent Bookings */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Recent Bookings</h2>
                    <Link
                        href="/admin/bookings"
                        className="text-primary font-medium text-sm hover:underline flex items-center gap-1"
                    >
                        View All
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Cleaner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBookingsData.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.user.firstName} {booking.user.lastName}</TableCell>
                                    <TableCell>{booking.serviceType.name}</TableCell>
                                    <TableCell>{formatDate(booking.scheduledDate)}</TableCell>
                                    <TableCell>
                                        {booking.assignments && booking.assignments[0] ? (
                                            <span>{booking.assignments[0].cleaner.user.firstName} {booking.assignments[0].cleaner.user.lastName}</span>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Unassigned</span>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
