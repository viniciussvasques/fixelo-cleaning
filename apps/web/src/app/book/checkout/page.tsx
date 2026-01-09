'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/booking';
import { formatCurrency } from '@/lib/utils';
import { ServiceType, AddOn } from '@prisma/client';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ amount }: { amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const _router = useRouter();
    const { reset: _reset } = useBookingStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/book/success`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
            </button>

            <div className="text-center text-xs text-gray-500">
                <p>🔒 Secure payment processing by Stripe</p>
                <p className="mt-1">By clicking Pay, you agree to our Terms of Service.</p>
            </div>
        </form>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const {
        serviceId,
        homeDetails,
        selectedDate,
        selectedTimeSlot,
        address,
        specialInstructions,
        addOns,
        reset: _reset
    } = useBookingStore();

    const [service, setService] = useState<ServiceType | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!serviceId || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
            router.push('/book');
            return;
        }
        initializeCheckout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, homeDetails, selectedDate, selectedTimeSlot, address]);

    const initializeCheckout = async () => {
        try {
            // 1. Fetch Service & Add-ons
            const [serviceRes, addOnsRes] = await Promise.all([
                fetch('/api/service-types'),
                fetch('/api/add-ons')
            ]);

            const serviceData = await serviceRes.json();
            const addOnsData = await addOnsRes.json();

            const foundService = serviceData.serviceTypes.find((s: ServiceType) => s.id === serviceId);
            if (foundService) setService(foundService);
            if (addOnsData.addOns) setAvailableAddOns(addOnsData.addOns);

            // 2. Calculate price
            // 2. Calculate price
            let price = foundService?.basePrice || 0;
            if (homeDetails) {
                if (homeDetails.bedrooms > 1) price += (homeDetails.bedrooms - 1) * 20;
                if (homeDetails.bathrooms > 1) price += (homeDetails.bathrooms - 1) * 25;
                if (homeDetails.hasPets) price += 15;
            }

            const addOnsPrice = addOns.reduce((total, addOnId) => {
                const ad = addOnsData.addOns?.find((a: AddOn) => a.id === addOnId);
                return total + (ad ? ad.price : 0);
            }, 0);

            const totalPrice = price + addOnsPrice;
            setCalculatedPrice(totalPrice);

            // 3. Create Payment Intent
            const paymentResponse = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalPrice,
                    serviceId,
                    homeDetails,
                    schedule: { // Normalize to what CREATE API expects
                        date: selectedDate,
                        timeSlot: selectedTimeSlot
                    },
                    address,
                    specialInstructions,
                    addOns,
                }),
            });

            const { clientSecret: secret } = await paymentResponse.json();
            setClientSecret(secret);
            setIsLoading(false);
        } catch (error) {
            console.error('Checkout initialization error:', error);
            setIsLoading(false);
        }
    };

    if (isLoading || !service || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Preparing secure checkout...</p>
                </div>
            </div>
        );
    }

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#2563eb',
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
                <p className="text-gray-600">Complete your booking</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Payment Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>

                        {clientSecret && (
                            <Elements options={options} stripe={stripePromise}>
                                <CheckoutForm amount={calculatedPrice} />
                            </Elements>
                        )}
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* Summary Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

                        <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">{service.name}</p>
                                <p className="text-sm text-gray-500">
                                    {homeDetails.bedrooms} Bed, {homeDetails.bathrooms} Bath
                                    {homeDetails.hasPets && ', Pets'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Date & Time</p>
                                <p className="text-sm text-gray-500">
                                    {selectedDate && format(new Date(selectedDate), 'MMM do, yyyy')}
                                    <br />
                                    {selectedTimeSlot === 'morning' ? '8:00 AM - 11:00 AM' :
                                        selectedTimeSlot === 'afternoon' ? '12:00 PM - 3:00 PM' : '3:00 PM - 6:00 PM'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Location</p>
                                <p className="text-sm text-gray-500">
                                    {address.street}, {address.city}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base Price</span>
                                <span className="font-medium">
                                    {formatCurrency(calculatedPrice - addOns.reduce((acc, id) => {
                                        const ad = availableAddOns.find(a => a.id === id);
                                        return acc + (ad ? ad.price : 0);
                                    }, 0))}
                                </span>
                            </div>

                            {addOns.length > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Add-ons</span>
                                    <span className="font-medium">
                                        {formatCurrency(addOns.reduce((acc, id) => {
                                            const ad = availableAddOns.find(a => a.id === id);
                                            return acc + (ad ? ad.price : 0);
                                        }, 0))}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(calculatedPrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
