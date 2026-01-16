'use client';

import { useState, useEffect } from 'react';
import { Wrench, Power, Key, CreditCard, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettings {
    maintenanceMode: boolean;
    maintenancePassword: string;
    stripeMode: string;
}

export default function MaintenancePage() {
    const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/maintenance');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (e) {
            console.error('Failed to fetch settings:', e);
            toast.error('Failed to load maintenance settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleAction = async (action: string, payload?: Record<string, string>) => {
        setActionLoading(action);
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Settings updated');
                fetchSettings();
                if (action === 'update_password') setNewPassword('');
            } else {
                toast.error(data.error || 'Failed to update');
            }
        } catch {
            toast.error('Failed to update settings');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Wrench className="w-7 h-7 text-orange-500" />
                    Maintenance Mode
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Control site access and test mode settings
                </p>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border-2 ${settings?.maintenanceMode
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${settings?.maintenanceMode
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                            }`}>
                            <Power className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Current Status: {settings?.maintenanceMode ? 'MAINTENANCE' : 'PRODUCTION'}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {settings?.maintenanceMode
                                    ? 'Site is blocked for non-admin users'
                                    : 'Site is accessible to everyone'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleAction(settings?.maintenanceMode ? 'disable' : 'enable')}
                        disabled={actionLoading === 'enable' || actionLoading === 'disable'}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${settings?.maintenanceMode
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            } disabled:opacity-50`}
                    >
                        {actionLoading ? 'Processing...' : settings?.maintenanceMode ? 'Go Live' : 'Enable Maintenance'}
                    </button>
                </div>

                {settings?.maintenanceMode && (
                    <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Important:</strong> For maintenance mode to work, set{' '}
                                <code className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded">
                                    MAINTENANCE_MODE=true
                                </code>{' '}
                                in your environment variables and restart the server.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Password Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Access Password</h3>
                            <p className="text-sm text-slate-500">Password for bypassing maintenance</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-300">Current:</span>
                            <code className="font-mono text-sm">{settings?.maintenancePassword}</code>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password..."
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                            <button
                                onClick={() => handleAction('update_password', { maintenancePassword: newPassword })}
                                disabled={!newPassword || actionLoading === 'update_password'}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            >
                                {actionLoading === 'update_password' ? '...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stripe Mode Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Stripe Mode</h3>
                            <p className="text-sm text-slate-500">Switch between test and live keys</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-300">Current:</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${settings?.stripeMode === 'production'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                {settings?.stripeMode?.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('set_stripe_mode', { stripeMode: 'test' })}
                                disabled={settings?.stripeMode === 'test' || actionLoading === 'set_stripe_mode'}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${settings?.stripeMode === 'test'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white hover:bg-slate-300'
                                    } disabled:opacity-50`}
                            >
                                {settings?.stripeMode === 'test' && <Check className="w-4 h-4 inline mr-1" />}
                                Test Mode
                            </button>
                            <button
                                onClick={() => handleAction('set_stripe_mode', { stripeMode: 'production' })}
                                disabled={settings?.stripeMode === 'production' || actionLoading === 'set_stripe_mode'}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${settings?.stripeMode === 'production'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white hover:bg-slate-300'
                                    } disabled:opacity-50`}
                            >
                                {settings?.stripeMode === 'production' && <Check className="w-4 h-4 inline mr-1" />}
                                Production
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How It Works</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Maintenance Mode:</strong> Blocks all non-admin users and shows password page</li>
                    <li>• <strong>Access Password:</strong> Users with password can access the site during maintenance</li>
                    <li>• <strong>Stripe Mode:</strong> Changes which Stripe keys are used (requires server restart)</li>
                    <li>• <strong>Admins:</strong> Can always access the site regardless of maintenance status</li>
                </ul>
            </div>
        </div>
    );
}
