'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Building, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CleanerBankingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [bankStatus, setBankStatus] = useState<'LOADING' | 'CONNECTED' | 'NOT_CONNECTED'>('LOADING');

    const isSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        if (isSuccess) {
            toast.success('Bank account connected successfully!');
            setBankStatus('CONNECTED');
            // Clean URL
            router.replace('/cleaner/banking');
        } else {
            // Ideally we check status from an API here to persist state
            // For MVP, we'll assume NOT_CONNECTED unless we just came back from success, 
            // OR we can fetch profile to check if stripeAccountId exists and checks out.
            // Let's do a quick check-status call.
            checkBankStatus();
        }
    }, [isSuccess, router]);

    const checkBankStatus = async () => {
        try {
            const res = await fetch('/api/cleaner/status');
            if (res.ok) {
                const data = await res.json();
                if (data.connected) {
                    setBankStatus('CONNECTED');
                } else {
                    setBankStatus('NOT_CONNECTED');
                }
            } else {
                setBankStatus('NOT_CONNECTED');
            }
        } catch (_e) {
            setBankStatus('NOT_CONNECTED');
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cleaner/create-account-link', {
                method: 'POST'
            });
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error('Failed to initialize bank connection');
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error');
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Banking & Payouts</h1>
            <p className="text-muted-foreground mb-8">
                Manage how you get paid. Fixelo uses Stripe for secure weekly payouts.
            </p>

            <Card className="overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                            <Building className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                            <CardTitle>Stripe Connect</CardTitle>
                            <CardDescription>Secure payment processing</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    {bankStatus === 'CONNECTED' ? (
                        <div className="space-y-4">
                            <Alert className="bg-green-50 border-green-200 text-green-800">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <AlertTitle>Account Connected</AlertTitle>
                                <AlertDescription>
                                    Your bank account is active. You will receive automatic payouts every Friday for completed jobs.
                                </AlertDescription>
                            </Alert>

                            <Button variant="outline" className="w-full" onClick={handleConnect}>
                                Update Banking Information
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p>Get paid directly to your bank account or debit card.</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p>Weekly automatic transfers every Friday.</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p>Secure, encrypted, and compliant with financial regulations.</p>
                            </div>

                            <Button
                                size="lg"
                                className="w-full bg-[#635BFF] hover:bg-[#5349E8] text-white" // Stripe blurple brand color
                                onClick={handleConnect}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect with Stripe
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground mt-8">
                Payments are processed by Stripe. Fixelo does not store your bank account information.
            </p>
        </div>
    );
}
