'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useBookingStore } from '@/store/booking';
import { ServiceType, AddOn } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { StripeProvider } from '@/components/providers/StripeProvider';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function ReviewPage() {
    const router = useRouter();
    const {
        serviceId,
        homeDetails,
        selectedDate,
        selectedTimeSlot,
        address,
        addOns,
    } = useBookingStore();

    // Local state
    const [service, setService] = useState<ServiceType | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!serviceId || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
            router.push('/book');
            return;
        }

        initializeBooking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, homeDetails, selectedDate, selectedTimeSlot, address]); // Run once on mount if data exists

    const initializeBooking = async () => {
        try {
            // 1. Fetch Service & Add-ons to display summary locally
            const [serviceRes, addOnsRes] = await Promise.all([
                fetch('/api/service-types'),
                fetch('/api/add-ons')
            ]);

            const serviceData = await serviceRes.json();
            const addOnsData = await addOnsRes.json();

            const foundService = serviceData.serviceTypes.find((s: ServiceType) => s.id === serviceId);
            if (foundService) setService(foundService);
            if (addOnsData.addOns) setAvailableAddOns(addOnsData.addOns);

            // 2. Create Intent on Server
            // We pass all booking data. Server validates and creates intent.
            const bookingRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    homeDetails,
                    schedule: { date: selectedDate, timeSlot: selectedTimeSlot },
                    address,
                    addOns,
                    userId: 'temp-user-id' // Ideally from session, but for now passing dummy or handling on server
                }),
            });

            if (!bookingRes.ok) {
                throw new Error('Failed to create booking');
            }

            const bookingData = await bookingRes.json();
            setClientSecret(bookingData.clientSecret);
            setCalculatedPrice(bookingData.totalPrice);

            setIsLoading(false);

        } catch (error) {
            console.error('Initialization error:', error);
            // Handle error (show toast, etc)
        }
    };

    if (isLoading || !service || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500">Preparing secure checkout...</p>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Bar */}
                <div className="mb-8 hidden sm:block">
                    <div className="flex items-center space-x-4 text-sm font-medium text-gray-500">
                        <span>Service</span>
                        <span>→</span>
                        <span>Details</span>
                        <span>→</span>
                        <span>Schedule</span>
                        <span>→</span>
                        <span>Address</span>
                        <span>→</span>
                        <span>Add-ons</span>
                        <span>→</span>
                        <span className="text-blue-600">Payment</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Summary Column */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Booking</h2>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 space-y-6">
                                {/* Service */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Service</h3>
                                        <Link href="/book/details" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </Link>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-900">{service.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {homeDetails.bedrooms} Bed, {homeDetails.bathrooms} Bath
                                                {homeDetails.hasPets && ', Pets'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Date & Time</h3>
                                        <Link href="/book/schedule" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </Link>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        {selectedDate && format(new Date(selectedDate), 'MMM do, yyyy')}
                                    </p>
                                    <p className="text-gray-600">
                                        {selectedTimeSlot === 'morning' ? '8:00 AM - 11:00 AM' :
                                            selectedTimeSlot === 'afternoon' ? '12:00 PM - 3:00 PM' : '3:00 PM - 6:00 PM'}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Location</h3>
                                        <Link href="/book/address" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </Link>
                                    </div>
                                    <p className="font-medium text-gray-900">{address.street}</p>
                                    <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                                    {address.unit && <p className="text-gray-600">Unit: {address.unit}</p>}
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Add-ons</h3>
                                        <Link href="/book/addons" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </Link>
                                    </div>
                                    {addOns.length > 0 ? (
                                        <ul className="space-y-1">
                                            {addOns.map(id => {
                                                const ad = availableAddOns.find(a => a.id === id);
                                                return ad ? (
                                                    <li key={id} className="flex justify-between text-sm">
                                                        <span className="text-gray-700">{ad.name}</span>
                                                        <span className="text-gray-500">{formatCurrency(ad.price)}</span>
                                                    </li>
                                                ) : null;
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No add-ons selected</p>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(calculatedPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => router.back()} className="mt-6 text-gray-600 hover:text-gray-900 font-medium">
                            ← Back
                        </button>
                    </div>

                    {/* Payment Column */}
                    <div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
                            {clientSecret && (
                                <StripeProvider clientSecret={clientSecret}>
                                    <CheckoutForm amount={calculatedPrice} />
                                </StripeProvider>
                            )}
                        </div>
                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>🔒 Secure payment processing by Stripe</p>
                            <p className="mt-2 text-xs">
                                By clicking Pay, you agree to our Terms of Service and Cancellation Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
