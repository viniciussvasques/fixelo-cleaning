'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/store/booking';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const { reset, selectedDate, selectedTimeSlot, address, serviceId } = useBookingStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const payment_intent_client_secret = searchParams.get('payment_intent_client_secret');

    // We need to verify the payment intent status here
    // In a real app, we would also verify it server-side to prevent fraud
    // For this MVP, we will assume if we have a success status from Stripe, we can create the booking in DB

    useEffect(() => {
        if (!payment_intent_client_secret) {
            setStatus('failed');
            return;
        }

        // Simulating verification and saving to DB
        // In a real implementation: Call an API that verifies stripe PaymentIntent and Creates Booking

        const saveBooking = async () => {
            try {
                // Determine user ID or guest status (Auth handled by session on server)

                const response = await fetch('/api/bookings/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentIntentId: payment_intent_client_secret,
                        serviceId,
                        homeDetails: useBookingStore.getState().homeDetails, // Ensure we get current state
                        schedule: { date: selectedDate, timeSlot: selectedTimeSlot },
                        address,
                        specialInstructions: useBookingStore.getState().specialInstructions,
                        addOns: useBookingStore.getState().addOns,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    if (data.message === 'Booking already exists') {
                        // Already created, just show success
                        setStatus('success');
                        reset();
                        return;
                    }
                    throw new Error(data.error || 'Failed to create booking');
                }

                setStatus('success');
                reset(); // Clear the store
            } catch (error) {
                console.error('Save booking error:', error);
                setStatus('failed');
            }
        };

        if (payment_intent_client_secret) {
            saveBooking();
        }
    }, [payment_intent_client_secret, reset, serviceId, selectedDate, selectedTimeSlot, address]);


    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Finalizing your booking...</h2>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                    <p className="text-gray-600 mb-6">We couldn't verify your payment. Please try again or contact support.</p>
                    <Link href="/book/checkout" className="block w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                        Return to Checkout
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 mb-8">
                    Your cleaning service has been successfully scheduled. We've sent a confirmation email to you.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                    <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Booking Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status</span>
                            <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded text-sm border border-green-200">Confirmed</span>
                        </div>
                        {/* We use local state or store if accessible, but store is reset. Real app would fetch from DB using ID */}
                    </div>
                </div>

                <div className="space-y-4">
                    <Link href="/dashboard" className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                        Go to Dashboard
                    </Link>
                    <Link href="/" className="block w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <SuccessPageContent />
        </Suspense>
    );
}
