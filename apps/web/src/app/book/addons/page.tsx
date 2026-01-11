'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/booking';
import { ServiceType, AddOn } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default function AddOnsPage() {
    const router = useRouter();
    const {
        serviceId,
        homeDetails,
        selectedDate,
        selectedTimeSlot,
        address,
        addOns,
        setAddOns
    } = useBookingStore();

    // Local state
    const [service, setService] = useState<ServiceType | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [calculatedPrice, setCalculatedPrice] = useState(0);

    useEffect(() => {
        if (!serviceId || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
            router.push('/book');
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId, homeDetails, selectedDate, selectedTimeSlot, address]);

    useEffect(() => {
        if (service && homeDetails) {
            calculatePrice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [service, homeDetails, addOns, availableAddOns]);

    const fetchData = async () => {
        try {
            const [serviceRes, addOnsRes] = await Promise.all([
                fetch('/api/service-types'),
                fetch('/api/add-ons')
            ]);

            const serviceData = await serviceRes.json();
            const addOnsData = await addOnsRes.json();

            const foundService = serviceData.serviceTypes.find((s: ServiceType) => s.id === serviceId);
            if (foundService) setService(foundService);

            if (addOnsData.addOns) setAvailableAddOns(addOnsData.addOns);
        } catch (error) {
            console.error('Failed to fetch booking data', error);
        }
    };

    const calculatePrice = () => {
        if (!service || !homeDetails) return;

        // Use service pricing instead of hardcoded values
        let price = service.basePrice;

        if (homeDetails.bedrooms > 1) {
            price += (homeDetails.bedrooms - 1) * ((service as any).pricePerBed || 0);
        }
        if (homeDetails.bathrooms > 1) {
            price += (homeDetails.bathrooms - 1) * ((service as any).pricePerBath || 0);
        }
        if (homeDetails.hasPets) {
            price += ((service as any).pricePerPet || 0);
        }

        // Add selected add-ons price
        const addOnsPrice = addOns.reduce((total, addOnId) => {
            const ad = availableAddOns.find(a => a.id === addOnId);
            return total + (ad ? ad.price : 0);
        }, 0);

        setCalculatedPrice(price + addOnsPrice);
    };

    const toggleAddOn = (addOnId: string) => {
        if (addOns.includes(addOnId)) {
            setAddOns(addOns.filter(id => id !== addOnId));
        } else {
            setAddOns([...addOns, addOnId]);
        }
    };

    const handleContinue = () => {
        router.push('/book/checkout');
    };

    if (!service || !homeDetails || !selectedDate || !selectedTimeSlot || !address) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
                        <span className="text-blue-600">Add-ons</span>
                        <span>→</span>
                        <span>Confirm</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Add-ons</h2>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {availableAddOns.map((addOn) => (
                                    <div
                                        key={addOn.id}
                                        onClick={() => toggleAddOn(addOn.id)}
                                        className={`cursor-pointer border rounded-lg p-4 transition-all hover:shadow-sm ${addOns.includes(addOn.id)
                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900">{addOn.name}</h3>
                                            <span className="font-medium text-blue-600">
                                                +{formatCurrency(addOn.price)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{addOn.description}</p>
                                        {addOn.timeAdded > 0 && (
                                            <div className="mt-2 text-xs text-gray-400">
                                                +{addOn.timeAdded} mins
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {availableAddOns.length === 0 && (
                                <p className="text-gray-500">No add-ons available for this service.</p>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleContinue}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                            >
                                Continue to Review →
                            </button>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

                            <div className="pb-4 border-b border-gray-100 mb-4 space-y-2">
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
                                    <span className="text-gray-600">Base Price + Content</span>
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
        </div>
    );
}
