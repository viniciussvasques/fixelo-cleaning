'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Loader2, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
}

function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/payment-methods', { method: 'POST' });
            const { clientSecret, error } = await res.json();

            if (error) throw new Error(error);

            const result = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                },
            });

            if (result.error) {
                toast.error(result.error.message);
            } else {
                toast.success('Card added successfully!');
                onSuccess();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add card';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-md bg-white">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    }
                }} />
            </div>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !stripe}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Card
                </button>
            </div>
        </form>
    );
}

export default function PaymentMethodsClient() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch('/api/user/payment-methods');
            const data = await res.json();
            setPaymentMethods(data);
        } catch (_error) {
            toast.error('Failed to load payment methods');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this card?')) return;

        try {
            const res = await fetch(`/api/user/payment-methods?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Card removed');
                setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
            } else {
                throw new Error('Failed to delete');
            }
        } catch (_error) {
            toast.error('Failed to remove card');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Saved Cards</h2>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Card
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {showAddForm ? (
                    <div className="max-w-md mx-auto py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Add New Card</h3>
                            <button onClick={() => setShowAddForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <Elements stripe={stripePromise}>
                            <AddCardForm
                                onSuccess={() => {
                                    setShowAddForm(false);
                                    fetchPaymentMethods();
                                }}
                                onCancel={() => setShowAddForm(false)}
                            />
                        </Elements>
                    </div>
                ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No payment methods</h3>
                        <p className="mt-2 text-gray-500">Add a credit or debit card to make bookings faster</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Payment Method
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {paymentMethods.map((pm) => (
                            <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-50 rounded-md">
                                        <CreditCard className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {pm.brand} •••• {pm.last4}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Expires {pm.expMonth}/{pm.expYear}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(pm.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
