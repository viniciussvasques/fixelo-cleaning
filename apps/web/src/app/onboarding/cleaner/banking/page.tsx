'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ExternalLink, CheckCircle } from 'lucide-react';

export default function BankingStep() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [stripeConnected, setStripeConnected] = useState(false);

    useEffect(() => {
        // Check if already connected
        checkStripeStatus();
    }, []);

    const checkStripeStatus = async () => {
        try {
            const res = await fetch('/api/cleaner/status');
            if (res.ok) {
                const data = await res.json();
                setStripeConnected(!!data.stripeAccountId);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handleConnectStripe = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/cleaner/create-account-link', {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to connect');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
            setIsLoading(false);
        }
    };

    const handleSubmitApplication = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/cleaner/onboarding/submit', {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit');
            }

            toast.success('Application submitted successfully!');
            router.push('/onboarding/cleaner/pending');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Banking Setup</h1>
                <p className="text-slate-600 mt-1">Connect your bank account to receive payouts</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                {/* Stripe Connect Card */}
                <div className={`border-2 rounded-xl p-6 text-center ${stripeConnected ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                    {stripeConnected ? (
                        <>
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                            <h3 className="font-semibold text-green-800">Bank Account Connected!</h3>
                            <p className="text-sm text-green-700 mt-1">
                                Your Stripe account is ready to receive payouts
                            </p>
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="font-semibold text-slate-800">Connect with Stripe</h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4">
                                Secure payment processing. Get paid every Friday.
                            </p>
                            <Button
                                onClick={handleConnectStripe}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Connect Stripe Account
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-blue-900 mb-2">✨ What you get:</p>
                    <ul className="space-y-1 text-blue-800">
                        <li>• Weekly payouts every Friday</li>
                        <li>• Direct deposit to your bank</li>
                        <li>• Keep 100% of tips</li>
                        <li>• Real-time earnings dashboard</li>
                    </ul>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/onboarding/cleaner/social')}
                    >
                        Back
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSubmitApplication}
                        disabled={!stripeConnected || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Application'
                        )}
                    </Button>
                </div>

                {!stripeConnected && (
                    <p className="text-center text-xs text-slate-500">
                        You must connect Stripe before submitting your application
                    </p>
                )}
            </div>
        </div>
    );
}
