
'use client';

import { useEffect, useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface TipPaymentFormProps {
    bookingId: string;
    amount: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

export function TipPaymentForm({ bookingId, amount, onSuccess, onCancel }: TipPaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!stripe) return;

        const clientSecret = new URLSearchParams(window.location.search).get(
            'payment_intent_client_secret'
        );

        if (!clientSecret) return;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // We don't want to redirect, we want to handle it here
                    return_url: `${window.location.origin}/dashboard/bookings/${bookingId}`,
                },
                redirect: 'if_required',
            });

            if (error) {
                if (error.type === 'card_error' || error.type === 'validation_error') {
                    setMessage(error.message || 'An unexpected error occurred.');
                } else {
                    setMessage('An unexpected error occurred.');
                }
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment success!
                onSuccess(paymentIntent.id);
            }
        } catch (err) {
            setMessage('An unexpected error occurred.');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 text-center">
                <p className="text-pink-600 mb-1">Total Tip Amount</p>
                <div className="text-3xl font-bold text-pink-700">${amount.toFixed(2)}</div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
                <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
            </div>

            {message && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                    {message}
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || !stripe || !elements}
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Heart className="w-4 h-4 mr-2" />
                            Pay Tip
                        </>
                    )}
                </Button>
            </div>

            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Payments secured by Stripe
            </p>
        </form>
    );
}
