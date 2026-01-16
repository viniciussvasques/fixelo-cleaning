'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, User, CheckCircle, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { QRCodeLogin } from '@/components/qr-code-login';

const accountSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountStep() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
    });

    // Pre-fill form with existing user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.firstName) setValue('firstName', data.firstName);
                    if (data.lastName) setValue('lastName', data.lastName);
                    if (data.phone) setValue('phone', data.phone);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            // Also try to use session data
            const nameParts = session.user.name?.split(' ') || [];
            if (nameParts[0]) setValue('firstName', nameParts[0]);
            if (nameParts[1]) setValue('lastName', nameParts.slice(1).join(' '));
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    }, [session, setValue]);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                    <CheckCircle className="w-4 h-4" />
                    Account Created
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Verify Your Information</h1>
                <p className="text-slate-600 mt-1">Please confirm your details are correct</p>
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
                        'Confirm & Continue'
                    )}
                </Button>
            </form>

            {/* Continue on Mobile Option */}
            <div className="mt-8 border-t border-slate-200 pt-6">
                <button
                    type="button"
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 text-sm py-2"
                >
                    <Smartphone className="w-4 h-4" />
                    <span>Continue on your phone instead</span>
                    {showQR ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showQR && (
                    <div className="mt-4">
                        <QRCodeLogin
                            title="Continue on Mobile"
                            description="Scan to complete registration on your phone"
                        />
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-slate-500 mt-8">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
        </div>
    );
}
