'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookingStore } from '@/store/booking';
import { ServiceType } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { Counter } from '@/components/ui/counter';
import { getBookingConfig } from '@/app/book/actions';
import { AddOn } from '@prisma/client';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

const homeDetailsSchema = z.object({
    bedrooms: z.number().int().min(1).max(6),
    bathrooms: z.number().int().min(1).max(5),
    squareFootage: z.string().transform((val) => val === '' ? undefined : Number(val)).pipe(z.number().int().optional()),
    hasPets: z.boolean(),
});

type HomeDetailsData = z.infer<typeof homeDetailsSchema>;

function BookDetailsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');

    const [service, setService] = useState<ServiceType | null>(null);
    const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
    const [estimatedTime, setEstimatedTime] = useState<number>(0);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [config, setConfig] = useState({ maxBedrooms: 6, maxBathrooms: 5 });

    const {
        register,
        watch,
        handleSubmit,
        setValue,
        formState: { errors: _errors },
    } = useForm<HomeDetailsData>({
        resolver: zodResolver(homeDetailsSchema),
        defaultValues: {
            bedrooms: 2,
            bathrooms: 2,
            hasPets: false,
        },
    });

    const [error, setError] = useState<string | null>(null);
    const setServiceIdStore = useBookingStore((state) => state.setServiceId);
    const setAddOnsStore = useBookingStore((state) => state.setAddOns);
    const setHomeDetails = useBookingStore((state) => state.setHomeDetails);
    const addOns = useBookingStore((state) => state.addOns);

    const bedrooms = watch('bedrooms');
    const bathrooms = watch('bathrooms');
    const hasPets = watch('hasPets');

    const calculatePrice = React.useCallback(() => {
        if (!service) return;

        let price = service.basePrice;

        const pricePerBed = (service as any).pricePerBed ?? 20;
        const pricePerBath = (service as any).pricePerBath ?? 25;
        const pricePerPet = (service as any).pricePerPet ?? 15;

        if (bedrooms > 1) price += (bedrooms - 1) * pricePerBed;
        if (bathrooms > 1) price += (bathrooms - 1) * pricePerBath;
        if (hasPets) price += pricePerPet;

        addOns.forEach(addOnId => {
            const addOn = availableAddOns.find(a => a.id === addOnId);
            if (addOn) {
                price += addOn.price;
            }
        });

        setCalculatedPrice(price);

        const baseTime = 120;
        let time = baseTime + (bedrooms - 1) * service.timePerBed + (bathrooms - 1) * service.timePerBath;

        addOns.forEach(addOnId => {
            const addOn = availableAddOns.find(a => a.id === addOnId);
            if (addOn) {
                time += addOn.timeAdded;
            }
        });

        setEstimatedTime(time);
    }, [bedrooms, bathrooms, hasPets, service, addOns, availableAddOns]);

    const fetchService = React.useCallback(async () => {
        try {
            const response = await fetch('/api/service-types');
            const data = await response.json();
            const selectedService = data.serviceTypes.find(
                (s: ServiceType) => s.id === serviceId
            );
            if (selectedService) {
                setService(selectedService);
            } else {
                setError(`Service not found for ID: ${serviceId}`);
            }
        } catch (error) {
            console.error('Error fetching service:', error);
            setError('Error fetching service details');
        }
    }, [serviceId]);

    // Register custom inputs manually since we replaced selects with Counters
    useEffect(() => {
        register('bedrooms');
        register('bathrooms');
    }, [register]);

    useEffect(() => {
        getBookingConfig().then(data => {
            setAvailableAddOns(data.addOns);
            setConfig(data.config);
        });
    }, []);

    useEffect(() => {
        if (!serviceId) {
            setError('No service ID provided in URL');
            return;
        }
        setServiceIdStore(serviceId);
        fetchService();
    }, [serviceId, setServiceIdStore, fetchService]);

    useEffect(() => {
        if (service) {
            calculatePrice();
        }
    }, [service, calculatePrice]);


    const onSubmit = (data: HomeDetailsData) => {
        setHomeDetails({
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            hasPets: data.hasPets,
            squareFootage: data.squareFootage,
        });
        router.push('/book/schedule');
    };

    const toggleAddOn = (id: string) => {
        if (addOns.includes(id)) {
            setAddOnsStore(addOns.filter(a => a !== id));
        } else {
            setAddOnsStore([...addOns, id]);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <h2 className="text-red-600 text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/book')}
                        className="btn btn-secondary w-full"
                    >
                        Return to Selection
                    </button>
                </div>
            </div>
        );
    }

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
                        <span className="text-sm font-bold text-primary tracking-wide">Step 2 of 5</span>
                        <span className="text-sm text-muted-foreground">Home Details</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: '33%' }}></div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Header */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customize your clean</h1>
                            <p className="text-gray-500">
                                You selected <span className="font-semibold text-primary">{service.name}</span>. Let's tailor it to your home.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                            {/* Room Counters */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-8">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Home Size</h3>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <Counter
                                        label="Bedrooms"
                                        value={bedrooms}
                                        onChange={(val) => setValue('bedrooms', val)}
                                        min={1}
                                        max={config.maxBedrooms}
                                        className="w-full"
                                    />
                                    <Counter
                                        label="Bathrooms"
                                        value={bathrooms}
                                        onChange={(val) => setValue('bathrooms', val)}
                                        min={1}
                                        max={config.maxBathrooms}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Square Footage <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        {...register('squareFootage')}
                                        type="number"
                                        placeholder="Sq. ft (e.g. 1500)"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Extras */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Extras & Add-ons</h3>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Pets Toggle Card */}
                                    <div
                                        onClick={() => setValue('hasPets', !hasPets)}
                                        className={`
                                            cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                            ${hasPets ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${hasPets ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-gray-900">I have Pets</span>
                                                <span className="text-xs text-gray-500">+$15 fee</span>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${hasPets ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                            {hasPets && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>

                                    {/* Dynamic Add-ons */}
                                    {availableAddOns.map((addOn) => (
                                        <div
                                            key={addOn.id}
                                            onClick={() => toggleAddOn(addOn.id)}
                                            className={`
                                                cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                                ${addOns.includes(addOn.id) ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${addOns.includes(addOn.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-gray-900">{addOn.name}</span>
                                                    <span className="text-xs text-gray-500">+${addOn.price} • {addOn.timeAdded} min</span>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${addOns.includes(addOn.id) ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                                {addOns.includes(addOn.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/book')}
                                    className="px-6 py-4 text-gray-600 font-semibold hover:text-gray-900 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-4 bg-primary text-primary-foreground rounded-xl shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-bold flex items-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Base Service</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(service.basePrice)}</span>
                                </div>

                                {(bedrooms > 1 || bathrooms > 1 || hasPets || addOns.length > 0) && <div className="h-px bg-gray-100 my-2"></div>}

                                {bedrooms > 1 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Extra Bedrooms ({bedrooms - 1})</span>
                                        <span className="font-medium">{formatCurrency((bedrooms - 1) * 20)}</span>
                                    </div>
                                )}
                                {bathrooms > 1 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Extra Bathrooms ({bathrooms - 1})</span>
                                        <span className="font-medium">{formatCurrency((bathrooms - 1) * 25)}</span>
                                    </div>
                                )}
                                {hasPets && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Pet Fee</span>
                                        <span className="font-medium">{formatCurrency(15)}</span>
                                    </div>
                                )}
                                {availableAddOns.filter(a => addOns.includes(a.id)).map((addOn) => (
                                    <div key={addOn.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">{addOn.name}</span>
                                        <span className="font-medium">{formatCurrency(addOn.price)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-medium text-gray-500">Total</span>
                                    <span className="text-3xl font-bold text-primary">{formatCurrency(calculatedPrice)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Est. duration: {Math.floor(estimatedTime / 60)}h {estimatedTime % 60}min</span>
                                </div>
                            </div>

                            <div className="text-xs text-center text-gray-400">
                                Taxes and fees included
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default function BookDetailsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <BookDetailsPageContent />
        </Suspense>
    );
}
