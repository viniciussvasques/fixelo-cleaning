'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Briefcase } from 'lucide-react';
import { signIn } from 'next-auth/react';

const signupSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['CUSTOMER', 'CLEANER']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

function SignUpPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const callbackUrl = searchParams.get('callbackUrl') || '';
    const roleParam = searchParams.get('role')?.toUpperCase();
    const initialRole = roleParam === 'CLEANER' ? 'CLEANER' : 'CUSTOMER';

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            role: initialRole,
        },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: SignupFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone || null,
                    password: data.password,
                    role: data.role,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Signup failed');
            }

            // Auto-login after successful signup
            const signInResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (signInResult?.error) {
                // Fallback to signin page if auto-login fails
                router.push('/auth/signin?message=Account created! Please sign in.');
                return;
            }

            // Redirect based on role
            if (data.role === 'CLEANER') {
                router.push('/cleaner/onboarding');
            } else {
                // For customers, use the callbackUrl if provided
                router.push(callbackUrl || '/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Create your Fixelo account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            I want to:
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label
                                className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedRole === 'CUSTOMER'
                                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    {...register('role')}
                                    type="radio"
                                    value="CUSTOMER"
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <User className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'CUSTOMER' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${selectedRole === 'CUSTOMER' ? 'text-blue-600' : 'text-gray-700'}`}>
                                        Book cleaning
                                    </span>
                                </div>
                            </label>

                            <label
                                className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedRole === 'CLEANER'
                                    ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    {...register('role')}
                                    type="radio"
                                    value="CLEANER"
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <Briefcase className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'CLEANER' ? 'text-green-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${selectedRole === 'CLEANER' ? 'text-green-600' : 'text-gray-700'}`}>
                                        Become a Pro
                                    </span>
                                </div>
                            </label>
                        </div>
                        {errors.role && (
                            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    {...register('firstName')}
                                    type="text"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="John"
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    {...register('lastName')}
                                    type="text"
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Doe"
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                autoComplete="email"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="john@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number (optional)
                            </label>
                            <input
                                {...register('phone')}
                                type="tel"
                                autoComplete="tel"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="+1234567890"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                autoComplete="new-password"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                autoComplete="new-password"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedRole === 'CLEANER'
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                            {isLoading
                                ? 'Creating account...'
                                : selectedRole === 'CLEANER'
                                    ? 'Create Pro Account'
                                    : 'Create Account'
                            }
                        </button>
                    </div>

                    {selectedRole === 'CLEANER' && (
                        <p className="text-center text-xs text-gray-500">
                            After signup, you'll complete your professional profile and get verified to start earning.
                        </p>
                    )}

                    <div className="text-center">
                        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                            ← Back to home
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <SignUpPageContent />
        </Suspense>
    );
}
