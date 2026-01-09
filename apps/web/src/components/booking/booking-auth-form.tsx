'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Schemas
const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const loginSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    referralCode: z.string().optional(),
});

type EmailData = z.infer<typeof emailSchema>;
type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

export function BookingAuthForm() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'login' | 'signup'>('email');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Forms
    const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) });
    const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
    const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) });

    const handleEmailSubmit = async (data: EmailData) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email }),
            });
            const result = await res.json();

            setEmail(data.email);
            setStep(result.exists ? 'login' : 'signup');
        } catch (_err) {
            setError('Failed to verify email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (data: LoginData) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signIn('credentials', {
                email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
                return;
            }

            // Success - Move to next step
            router.push('/book/address');
            router.refresh();
        } catch (_err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (data: SignupData) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Create Account
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    ...data,
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Signup failed');
            }

            // 2. Auto Login
            const loginResult = await signIn('credentials', {
                email,
                password: data.password,
                redirect: false,
            });

            if (loginResult?.error) {
                throw new Error('Account created but login failed.');
            }

            // Success
            router.push('/book/address');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full mx-auto">
            {step === 'email' && (
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Let's get started</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            {...emailForm.register('email')}
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                            autoFocus
                        />
                        {emailForm.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">{emailForm.formState.errors.email.message}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Checking...' : 'Continue'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                        We'll check if you have an account or help you create one.
                    </p>
                </form>
            )}

            {step === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {email} <button type="button" onClick={() => setStep('email')} className="text-primary hover:underline">(Change)</button>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            {...loginForm.register('password')}
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            autoFocus
                        />
                        {loginForm.formState.errors.password && (
                            <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In & Continue'}
                    </button>
                </form>
            )}

            {step === 'signup' && (
                <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {email} <button type="button" onClick={() => setStep('email')} className="text-primary hover:underline">(Change)</button>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                {...signupForm.register('firstName')}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            {signupForm.formState.errors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                {...signupForm.register('lastName')}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            {signupForm.formState.errors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                            {...signupForm.register('phone')}
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                        {signupForm.formState.errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            {...signupForm.register('password')}
                            type="password"
                            placeholder="Min 8 characters"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                        {signupForm.formState.errors.password && (
                            <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (Optional)</label>
                        <input
                            {...signupForm.register('referralCode')}
                            placeholder="Received an invite?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Creating Account...' : 'Join & Continue'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        By continuing, you agree to our Terms of Service.
                    </p>
                </form>
            )}
        </div>
    );
}
