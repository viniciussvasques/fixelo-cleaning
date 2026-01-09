import { prisma } from '@fixelo/database';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/lib/constants';
import {
    DollarSign,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    AlertCircle,
    PiggyBank,
} from 'lucide-react';

export default async function FinancialDashboardPage() {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const last30Days = subDays(today, 30);

    // Revenue Metrics
    const totalRevenue = await prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
        where: {
            status: 'SUCCEEDED',
            paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
    });

    const lastMonthRevenue = await prisma.payment.aggregate({
        where: {
            status: 'SUCCEEDED',
            paidAt: {
                gte: startOfMonth(subDays(monthStart, 1)),
                lt: monthStart,
            },
        },
        _sum: { amount: true },
    });

    // Platform Fees
    const financialSettings = await prisma.financialSettings.findFirst();
    const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
    const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;

    const estimatedPlatformFees = (totalRevenue._sum.amount || 0) * platformFeePercent;
    const monthlyPlatformFees = (monthlyRevenue._sum.amount || 0) * platformFeePercent;

    // Payout Stats - using separate queries instead of groupBy with multiple _sum fields
    const completedPayouts = await prisma.payout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
    });

    const pendingPayoutsData = await prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
    });

    const failedPayoutsData = await prisma.payout.aggregate({
        where: { status: 'FAILED' },
        _sum: { amount: true },
        _count: true,
    });

    const totalPaidOut = completedPayouts._sum?.amount || 0;
    const pendingPayouts = pendingPayoutsData._sum?.amount || 0;
    const failedPayouts = failedPayoutsData._sum?.amount || 0;
    const completedPayoutCount = completedPayouts._count || 0;

    // Recent Payments
    const recentPayments = await prisma.payment.findMany({
        where: { status: 'SUCCEEDED' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
            booking: {
                include: { user: true, serviceType: true }
            }
        }
    });

    // Calculate growth
    const lastMonthTotal = lastMonthRevenue._sum.amount || 0;
    const thisMonthTotal = monthlyRevenue._sum.amount || 0;
    const growthPercent = lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : '0';
    const isGrowthPositive = parseFloat(growthPercent) >= 0;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
                <p className="text-muted-foreground">
                    Platform revenue, payouts, and financial metrics
                </p>
            </div>

            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalRevenue._sum.amount || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isGrowthPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                            {isGrowthPositive ? (
                                <ArrowUpRight className="w-6 h-6 text-green-600" />
                            ) : (
                                <ArrowDownRight className="w-6 h-6 text-red-600" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-2xl font-bold">{formatCurrency(thisMonthTotal)}</p>
                            <p className={`text-xs ${isGrowthPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isGrowthPositive ? '+' : ''}{growthPercent}% vs last month
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <PiggyBank className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Platform Fees</p>
                            <p className="text-2xl font-bold">{formatCurrency(estimatedPlatformFees)}</p>
                            <p className="text-xs text-muted-foreground">{(platformFeePercent * 100).toFixed(0)}% of revenue</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Paid to Cleaners</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalPaidOut)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Pending Payouts</p>
                        <p className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingPayouts)}</p>
                    </div>
                </div>

                <div className="card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Completed This Month</p>
                        <p className="text-2xl font-bold text-green-700">
                            {completedPayoutCount} payouts
                        </p>
                    </div>
                </div>

                <div className="card p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Failed Payouts</p>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(failedPayouts)}</p>
                    </div>
                </div>
            </div>

            {/* Financial Settings */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Current Fee Structure</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-muted-foreground">Platform Fee</p>
                        <p className="text-2xl font-bold">{(platformFeePercent * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-muted-foreground">Insurance Reserve</p>
                        <p className="text-2xl font-bold">{(insuranceFeePercent * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-muted-foreground">Min Payout Amount</p>
                        <p className="text-2xl font-bold">{formatCurrency(financialSettings?.minPayoutAmount ?? 25)}</p>
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="card">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Recent Payments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Customer</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Service</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {recentPayments.map(payment => (
                                <tr key={payment.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium">
                                            {payment.booking?.user.firstName} {payment.booking?.user.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{payment.booking?.user.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {payment.booking?.serviceType?.name || 'Cleaning'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-600">
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy') : '-'}
                                    </td>
                                </tr>
                            ))}
                            {recentPayments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No payments yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
