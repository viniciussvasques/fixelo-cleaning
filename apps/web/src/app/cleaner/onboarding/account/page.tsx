'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Phone, User } from 'lucide-react';

const accountSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountStep() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
    });

    const onSubmit = async (data: AccountFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/cleaner/onboarding/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save');
            }

            toast.success('Account information saved!');
            router.push('/cleaner/onboarding/identity');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
                <p className="text-slate-600 mt-1">Let's start with your basic information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="firstName"
                                placeholder="John"
                                className="pl-10"
                                {...register('firstName')}
                            />
                        </div>
                        {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            placeholder="Doe"
                            {...register('lastName')}
                        />
                        {errors.lastName && (
                            <p className="text-sm text-red-500">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            className="pl-10"
                            {...register('phone')}
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                    <p className="text-xs text-slate-500">We'll send a verification code to this number</p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Continue to Identity Verification'
                    )}
                </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-8">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
        </div>
    );
}
