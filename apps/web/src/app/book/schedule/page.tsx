'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/booking';
import { formatCurrency } from '@/lib/utils';
import { ServiceType } from '@prisma/client';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

export default function SchedulePage() {
    const router = useRouter();
    const {
        serviceId,
        homeDetails,
        selectedDate,
        selectedTimeSlot,
        setSelectedDate,
        setSelectedTimeSlot
    } = useBookingStore();

    const [service, setService] = useState<ServiceType | null>(null);
    const [price, setPrice] = useState(0);

    // Mock time slots with icons
    const timeSlots = [
        { id: 'morning', label: 'Morning', period: '8:00 AM - 12:00 PM', icon: '☀️' },
        { id: 'afternoon', label: 'Afternoon', period: '12:00 PM - 4:00 PM', icon: '🌤️' },
        { id: 'evening', label: 'Late Afternoon', period: '4:00 PM - 7:00 PM', icon: '🌙' },
    ];

    useEffect(() => {
        const fetchServiceDetails = async () => {
            if (!serviceId) return;
            try {
                const res = await fetch('/api/service-types');
                const data = await res.json();
                const found = data.serviceTypes.find((s: ServiceType) => s.id === serviceId);
                if (found) setService(found);
            } catch (err) {
                console.error(err);
            }
        };
        fetchServiceDetails();
    }, [serviceId]);

    // Calculate estimated price for summary
    useEffect(() => {
        const fetchAddOnsAndCalculate = async () => {
            if (!service || !homeDetails) return;

            // Use service pricing instead of hardcoded values
            let p = service.basePrice;
            if (homeDetails.bedrooms > 1) p += (homeDetails.bedrooms - 1) * (service.pricePerBed || 0);
            if (homeDetails.bathrooms > 1) p += (homeDetails.bathrooms - 1) * (service.pricePerBath || 0);
            if (homeDetails.hasPets) p += (service.pricePerPet || 0);

            // Fetch add-ons dynamically
            try {
                const addOnsState = useBookingStore.getState().addOns || [];
                if (addOnsState.length > 0) {
                    const res = await fetch('/api/add-ons');
                    const data = await res.json();
                    addOnsState.forEach((addOnId: string) => {
                        // Search by id or slug
                        const addOn = data.addOns?.find((a: { id: string; slug: string; price: number }) =>
                            a.id === addOnId || a.slug === addOnId
                        );
                        if (addOn) p += addOn.price;
                    });
                }
            } catch (err) {
                console.error('Error fetching add-ons:', err);
            }

            setPrice(p);
        };

        fetchAddOnsAndCalculate();
    }, [service, homeDetails, selectedDate]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) setSelectedDate(date);
    };

    const handleContinue = async () => {
        router.push('/book/address');
    };

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-primary tracking-wide">Step 3 of 5</span>
                        <span className="text-sm text-muted-foreground">Schedule</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: '75%' }}></div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">When should we come?</h1>
                            <p className="text-gray-500">Choose a date and time for your <span className="font-semibold text-primary">{service?.name}</span>.</p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
                                    <Calendar
                                        selected={selectedDate || undefined}
                                        onSelect={handleDateSelect}
                                        disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </div>
                            </div>

                            {/* Time Slots Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time</h3>
                                <div className="grid gap-4">
                                    {timeSlots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedTimeSlot(slot.id)}
                                            className={`
                                                relative p-4 rounded-xl border-2 text-left transition-all duration-200 group w-full
                                                ${selectedTimeSlot === slot.id
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                    : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="text-2xl">{slot.icon}</div>
                                                <div>
                                                    <span className={`block font-bold ${selectedTimeSlot === slot.id ? 'text-primary' : 'text-gray-900'}`}>
                                                        {slot.label}
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-medium">
                                                        {slot.period}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedTimeSlot === slot.id && (
                                                <div className="absolute top-4 right-4 text-primary">
                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-4 text-gray-600 font-semibold hover:text-gray-900 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!selectedDate || !selectedTimeSlot}
                                className={`
                                    px-10 py-4 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all duration-200
                                    ${(!selectedDate || !selectedTimeSlot)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                Review Booking
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Service</span>
                                    <span className="font-medium text-gray-900">{service.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Home</span>
                                    <span className="font-medium text-gray-900">
                                        {homeDetails?.bedrooms} Bed, {homeDetails?.bathrooms} Bath
                                    </span>
                                </div>
                                {selectedDate && (
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Date</span>
                                        <span className="font-medium text-gray-900">
                                            {format(selectedDate, 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                                {selectedTimeSlot && (
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Time</span>
                                        <span className="font-medium text-gray-900 capitalize">{selectedTimeSlot}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-medium text-gray-500">Total</span>
                                    <span className="text-3xl font-bold text-primary">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Est. duration: 2h 30min</span>
                                </div>
                            </div>

                            <div className="text-xs text-center text-gray-400">
                                Taxes and fees included
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
