'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <h3 className="text-2xl font-bold">{value}</h3>
                        </div>
                    </div>
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

interface EarningItem {
    id: string;
    service: string;
    date: string;
    amount: number;
}

interface PayoutItem {
    id: string;
    createdAt: string;
    amount: number;
    status: string;
}

interface EarningsData {
    stats: {
        thisWeek: number;
        thisMonth: number;
        pending: number;
        lifetime: number;
    };
    pendingEarnings: EarningItem[];
    payouts: PayoutItem[];
}

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EarningsData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/cleaner/earnings');
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load earnings');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return <div>Error loading data.</div>;

    const { stats, pendingEarnings, payouts } = data;

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">My Earnings</h1>
                <p className="text-muted-foreground">Track your revenue and payouts.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="This Week"
                    value={formatMoney(stats.thisWeek)}
                    icon={TrendingUp}
                    description="Since Monday"
                />
                <StatCard
                    title="This Month"
                    value={formatMoney(stats.thisMonth)}
                    icon={Calendar}
                    description="Current month total"
                />
                <StatCard
                    title="Pending Payout"
                    value={formatMoney(stats.pending)}
                    icon={DollarSign}
                    description="Estimated next Friday"
                />
                <StatCard
                    title="Lifetime"
                    value={formatMoney(stats.lifetime)}
                    icon={CreditCard}
                    description="Total earnings to date"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Earnings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Earnings</CardTitle>
                        <CardDescription>Completed jobs waiting for weekly payout.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingEarnings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No pending earnings.</p>
                        ) : (
                            <div className="space-y-4">
                                {pendingEarnings.map((item: EarningItem) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.service}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(item.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-700">+{formatMoney(item.amount)}</p>
                                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                                Pending
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payout History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payout History</CardTitle>
                        <CardDescription>Recent transfers to your bank account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payouts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No payout history yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {payouts.map((payout: PayoutItem) => (
                                    <div key={payout.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Weekly Payout</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(payout.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatMoney(payout.amount)}</p>
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                {payout.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
