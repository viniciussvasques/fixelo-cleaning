import { prisma } from '@fixelo/database';
import {
    TrendingUp,
    DollarSign,
    Users,
    Calendar,
    Package,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/constants';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';


export default async function AnalyticsPage() {
    // Revenue analytics
    const totalRevenue = await prisma.booking.aggregate({
        where: { status: BookingStatus.COMPLETED },
        _sum: { totalPrice: true },
    });

    const thisMonthRevenue = await prisma.booking.aggregate({
        where: {
            status: BookingStatus.COMPLETED,
            scheduledDate: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
        },
        _sum: { totalPrice: true },
    });

    // Booking stats
    const totalBookings = await prisma.booking.count();
    const completedBookings = await prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
    });
    const pendingBookings = await prisma.booking.count({
        where: { status: BookingStatus.PENDING },
    });

    // User stats
    const totalCustomers = await prisma.user.count({
        where: { role: 'CUSTOMER' },
    });
    const totalCleaners = await prisma.cleanerProfile.count();
    const approvedCleaners = await prisma.cleanerProfile.count({
        where: { status: 'ACTIVE' },
    });

    // Service breakdown
    const serviceStats = await prisma.booking.groupBy({
        by: ['serviceTypeId'],
        _count: true,
        where: { status: BookingStatus.COMPLETED },
    });

    const services = await prisma.serviceType.findMany({
        where: {
            id: {
                in: serviceStats.map((s) => s.serviceTypeId),
            },
        },
    });

    const stats = [
        {
            title: 'Total Revenue',
            value: formatCurrency(totalRevenue._sum.totalPrice || 0),
            icon: <DollarSign className="w-6 h-6" />,
            description: 'All-time earnings',
        },
        {
            title: 'This Month Revenue',
            value: formatCurrency(thisMonthRevenue._sum.totalPrice || 0),
            icon: <TrendingUp className="w-6 h-6" />,
            description: 'Current month earnings',
        },
        {
            title: 'Total Customers',
            value: totalCustomers,
            icon: <Users className="w-6 h-6" />,
            description: `${totalCleaners} cleaners (${approvedCleaners} approved)`,
        },
        {
            title: 'Completed Bookings',
            value: completedBookings,
            icon: <Calendar className="w-6 h-6" />,
            description: `${pendingBookings} pending`,
        },
    ];

    const completionRate = totalBookings > 0
        ? ((completedBookings / totalBookings) * 100).toFixed(1)
        : '0';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                <p className="text-muted-foreground">
                    Track your business performance and metrics
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">Booking Completion Rate</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Completion Rate</span>
                            <span className="text-3xl font-bold text-success">{completionRate}%</span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-success transition-all"
                                style={{ width: `${completionRate}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{totalBookings}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-success">{completedBookings}</div>
                                <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-warning">{pendingBookings}</div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-6">Service Popularity</h2>
                    <div className="space-y-4">
                        {services.map((service) => {
                            const stat = serviceStats.find((s) => s.serviceTypeId === service.id);
                            const count = stat?._count || 0;
                            const percentage = totalBookings > 0
                                ? ((count / completedBookings) * 100).toFixed(0)
                                : '0';

                            return (
                                <div key={service.id} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{service.name}</span>
                                        <span className="text-muted-foreground">{count} bookings</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {services.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">
                                No completed bookings yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {formatCurrency(
                            completedBookings > 0
                                ? (totalRevenue._sum.totalPrice || 0) / completedBookings
                                : 0
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Booking Value</div>
                </div>

                <div className="card p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {totalCustomers > 0
                            ? (completedBookings / totalCustomers).toFixed(1)
                            : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Bookings per Customer</div>
                </div>

                <div className="card p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-info/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-info" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {approvedCleaners > 0
                            ? (completedBookings / approvedCleaners).toFixed(1)
                            : '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Bookings per Cleaner</div>
                </div>
            </div>
        </div>
    );
}
