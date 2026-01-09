'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookingStore } from '@/store/booking';
import { MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const addressSchema = z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().length(2, 'Use 2-letter state code'),
    zipCode: z.string().min(5, 'Valid Zip Code is required'),
    unit: z.string().optional(),
    specialInstructions: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

function AddressPageContent() {
    const router = useRouter();
    const {
        selectedDate,
        selectedTimeSlot,
        setAddress,
        address: storedAddress,
        setSpecialInstructions,
        specialInstructions: storedInstructions
    } = useBookingStore();

    useEffect(() => {
        if (!selectedDate || !selectedTimeSlot) {
            router.push('/book/schedule');
        }
    }, [selectedDate, selectedTimeSlot, router]);

    const { register, handleSubmit, formState: { errors } } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            ...(storedAddress || { street: '', city: '', state: '', zipCode: '', unit: '' }),
            specialInstructions: storedInstructions || '',
        },
    });

    const onSubmit = (data: AddressFormData) => {
        setAddress({
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            unit: data.unit,
        });
        setSpecialInstructions(data.specialInstructions || null);
        router.push('/book/review');
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-primary tracking-wide">Step 4 of 5</span>
                    <span className="text-sm text-gray-500 font-medium">Address</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: '80%' }} />
                </div>
            </div>

            <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Where is the cleaning?</h1>
                <p className="text-gray-500 text-lg">Enter the address where you'd like us to clean.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Service Address</h3>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Street Address</label>
                        <input {...register('street')} type="text" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" placeholder="123 Main Street" />
                        {errors.street && <p className="ml-1 text-sm text-red-500 font-medium">{errors.street.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Unit / Apt / Suite <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input {...register('unit')} type="text" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" placeholder="Apt 4B" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">City</label>
                            <input {...register('city')} type="text" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" placeholder="Orlando" />
                            {errors.city && <p className="ml-1 text-sm text-red-500 font-medium">{errors.city.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">State</label>
                            <input {...register('state')} type="text" maxLength={2} className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 uppercase" placeholder="FL" />
                            {errors.state && <p className="ml-1 text-sm text-red-500 font-medium">{errors.state.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Zip Code</label>
                        <input {...register('zipCode')} type="text" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400" placeholder="32801" />
                        {errors.zipCode && <p className="ml-1 text-sm text-red-500 font-medium">{errors.zipCode.message}</p>}
                    </div>

                    <div className="space-y-1 pt-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Special Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <Textarea {...register('specialInstructions')} className="min-h-[100px] rounded-xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 placeholder:text-gray-400 resize-none p-4" placeholder="Ex: Gate code is 1234, heavy traffic in morning, dog in backyard..." />
                        <p className="text-xs text-gray-500 ml-1">Let us know about access codes, keys, or any specific requests.</p>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button type="button" onClick={() => router.back()} className="flex-1 h-14 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button type="submit" className="flex-[2] h-14 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            Continue to Payment
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AddressPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div></div>}>
            <AddressPageContent />
        </Suspense>
    );
}
