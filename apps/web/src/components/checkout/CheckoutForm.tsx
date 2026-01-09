'use client';

import { useEffect, useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const _router = useRouter();

    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get(
            'payment_intent_client_secret'
        );

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case 'succeeded':
                    setMessage('Payment succeeded!');
                    break;
                case 'processing':
                    setMessage('Your payment is processing.');
                    break;
                case 'requires_payment_method':
                    setMessage('Your payment was not successful, please try again.');
                    break;
                default:
                    setMessage('Something went wrong.');
                    break;
            }
        });
    }, [stripe]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/book/success`,
            },
        });

        if (error.type === 'card_error' || error.type === 'validation_error') {
            setMessage(error.message || 'An unexpected error occurred.');
        } else {
            setMessage('An unexpected error occurred.');
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Display */}
            <div className="bg-[var(--primary)]/5 p-4 rounded-xl border border-[var(--primary)]/20">
                <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Total to pay</span>
                    <span className="text-2xl font-bold text-[var(--primary)]">{formatCurrency(amount)}</span>
                </div>
            </div>

            {/* Stripe Payment Element */}
            <div className="border border-[var(--border)] rounded-xl p-4">
                <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
            </div>

            {/* Submit Button */}
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="btn btn-primary w-full justify-center btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                    </div>
                ) : (
                    <>
                        <Lock className="w-4 h-4" />
                        Pay {formatCurrency(amount)}
                    </>
                )}
            </button>

            {/* Error Message */}
            {message && (
                <div id="payment-message" className="p-4 bg-[var(--error)]/10 text-[var(--error)] rounded-lg text-sm">
                    {message}
                </div>
            )}

            {/* Security Note */}
            <p className="text-xs text-center text-[var(--text-muted)]">
                Your payment is secured with 256-bit SSL encryption by Stripe.
            </p>
        </form>
    );
}
