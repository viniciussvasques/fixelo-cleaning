'use client';

import { useState, FormEvent } from 'react';
import { Wrench, Lock, AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/maintenance/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                // Refresh page to bypass maintenance
                window.location.reload();
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid password');
            }
        } catch {
            setError('Failed to verify password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 animate-pulse">
                        <Wrench className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Maintenance Mode
                        </h1>
                        <p className="text-slate-400">
                            We're currently performing scheduled maintenance.
                            Please check back soon!
                        </p>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center justify-center gap-6 mb-8 text-sm">
                        <div className="flex items-center gap-2 text-amber-400">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Test Mode Active</span>
                        </div>
                    </div>

                    {/* Auth form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                <Lock className="w-4 h-4" />
                                Access Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter maintenance password"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25"
                        >
                            {loading ? 'Verifying...' : 'Access Site'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        For urgent matters, contact support@fixelo.app
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-sm mt-8">
                    © 2026 Fixelo. All rights reserved.
                </p>
            </div>
        </div>
    );
}
