'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
    DollarSign, TrendingUp, Calendar, CreditCard, Loader2,
    ChevronRight, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
    Wallet, PiggyBank, BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface EarningItem {
    id: string;
    service: string;
    date: string;
    amount: number;
    status: string;
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
        lastWeek: number;
        thisMonth: number;
        pending: number;
        lifetime: number;
        nextPayoutDate: string;
    };
    pendingEarnings: EarningItem[];
    payouts: PayoutItem[];
}

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EarningsData | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/cleaner/earnings');
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            toast.error('Failed to load earnings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatMoneyDecimal = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Unable to load earnings data</p>
                <button 
                    onClick={fetchData} 
                    className="mt-4 text-green-600 font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { stats, pendingEarnings, payouts } = data;
    const weekChange = stats.lastWeek > 0 
        ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100 
        : 0;

    return (
        <div className="space-y-6 pb-4">
            {/* Main Earnings Card */}
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                    <p className="text-green-100 text-sm font-medium mb-1">Total Earnings</p>
                    <h1 className="text-4xl font-bold mb-6">{formatMoney(stats.lifetime)}</h1>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 opacity-80" />
                                <span className="text-xs opacity-80">This Week</span>
                            </div>
                            <p className="text-xl font-bold">{formatMoney(stats.thisWeek)}</p>
                            {weekChange !== 0 && (
                                <div className={`flex items-center gap-1 text-xs mt-1 ${weekChange > 0 ? 'text-green-200' : 'text-red-200'}`}>
                                    {weekChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(weekChange).toFixed(0)}% vs last week
                                </div>
                            )}
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 opacity-80" />
                                <span className="text-xs opacity-80">This Month</span>
                            </div>
                            <p className="text-xl font-bold">{formatMoney(stats.thisMonth)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Payout Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-700">Pending Payout</p>
                            <p className="text-2xl font-bold text-amber-800">{formatMoneyDecimal(stats.pending)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-amber-600">Next payout</p>
                        <p className="text-sm font-medium text-amber-800">{stats.nextPayoutDate || 'Friday'}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                    <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg font-bold">{pendingEarnings.length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-bold">{payouts.length}</p>
                    <p className="text-xs text-gray-500">Payouts</p>
                </div>
                <Link href="/cleaner/banking" className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:border-green-200 transition-colors">
                    <CreditCard className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Banking</p>
                    <p className="text-xs text-gray-500">Settings</p>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'pending' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500'
                    }`}
                >
                    Pending ({pendingEarnings.length})
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'history' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500'
                    }`}
                >
                    Payout History
                </button>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                <div className="space-y-3">
                    {pendingEarnings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No pending earnings</p>
                            <p className="text-xs text-gray-400 mt-1">Complete jobs to earn money</p>
                        </div>
                    ) : (
                        pendingEarnings.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">{item.service}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(item.date).toLocaleDateString(undefined, { 
                                                weekday: 'short', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+{formatMoneyDecimal(item.amount)}</p>
                                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                            <Clock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {payouts.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No payout history yet</p>
                            <p className="text-xs text-gray-400 mt-1">Payouts are processed weekly</p>
                        </div>
                    ) : (
                        payouts.map((payout) => (
                            <div key={payout.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            payout.status === 'PAID' ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                            <DollarSign className={`w-5 h-5 ${
                                                payout.status === 'PAID' ? 'text-green-600' : 'text-gray-500'
                                            }`} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Weekly Payout</h4>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payout.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatMoneyDecimal(payout.amount)}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                            payout.status === 'PAID' 
                                                ? 'bg-green-50 text-green-600' 
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {payout.status === 'PAID' && <CheckCircle className="w-3 h-3" />}
                                            {payout.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">How Payouts Work</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Payouts are processed every Friday</li>
                    <li>• You keep 83% of each job (15% platform + 2% insurance)</li>
                    <li>• Tips are paid 100% to you</li>
                    <li>• Minimum payout is $25</li>
                </ul>
            </div>
        </div>
    );
}
