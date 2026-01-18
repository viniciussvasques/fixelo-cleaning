'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Smartphone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function QRLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'validating' | 'valid' | 'invalid' | 'logging-in' | 'success' | 'error'>('validating');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setError('No token provided');
            return;
        }

        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await fetch(`/api/auth/qr-session?token=${token}`);
            const data = await res.json();

            if (!res.ok || !data.valid) {
                setStatus('invalid');
                setError(data.error || 'Invalid token');
                return;
            }

            setUserEmail(data.email);
            setStatus('valid');

        } catch (e) {
            console.error('Token validation error:', e);
            setStatus('invalid');
            setError('Failed to validate token');
        }
    };

    const handleLogin = async () => {
        if (!token) return;

        setStatus('logging-in');

        try {
            // Get user data from token
            const res = await fetch(`/api/auth/qr-session?token=${token}`);
            const data = await res.json();

            if (!data.valid) {
                setStatus('error');
                setError('Token expired or invalid');
                return;
            }

            // Use a special QR login endpoint that logs user in by ID
            const loginRes = await fetch('/api/auth/qr-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (!loginRes.ok) {
                throw new Error('Login failed');
            }

            // Delete the token after successful use
            await fetch(`/api/auth/qr-session?token=${token}`, { method: 'DELETE' });

            setStatus('success');

            // Redirect based on role
            setTimeout(() => {
                if (data.role === 'CLEANER') {
                    router.push('/onboarding/cleaner');
                } else if (data.role === 'ADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }, 1500);

        } catch (e) {
            console.error('Login error:', e);
            setStatus('error');
            setError('Failed to log in. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                    {status === 'validating' && (
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
                            <h2 className="text-xl font-semibold text-slate-900">Validating...</h2>
                            <p className="text-slate-500 mt-2">Checking your session</p>
                        </div>
                    )}

                    {status === 'valid' && (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Session Found!</h2>
                            <p className="text-slate-500 mt-2">
                                Continue as <span className="font-medium text-slate-700">{userEmail}</span>
                            </p>

                            <Button
                                onClick={handleLogin}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                Continue on Mobile
                            </Button>

                            <p className="text-xs text-slate-400 mt-4">
                                This will log you in and continue your registration
                            </p>
                        </div>
                    )}

                    {status === 'logging-in' && (
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
                            <h2 className="text-xl font-semibold text-slate-900">Logging in...</h2>
                            <p className="text-slate-500 mt-2">Please wait</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-green-600">Success!</h2>
                            <p className="text-slate-500 mt-2">Redirecting you...</p>
                        </div>
                    )}

                    {(status === 'invalid' || status === 'error') && (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-red-600">
                                {status === 'invalid' ? 'Invalid Link' : 'Error'}
                            </h2>
                            <p className="text-slate-500 mt-2">{error}</p>

                            <Button
                                onClick={() => router.push('/auth/signin')}
                                variant="outline"
                                className="mt-6"
                            >
                                Go to Login Page
                            </Button>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-400 text-sm mt-6">
                    © 2026 Fixelo. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default function QRLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <QRLoginContent />
        </Suspense>
    );
}
