'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send reset email');
            }

            setIsSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to your email address. Please check your inbox and
                            follow the instructions.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Didn't receive an email? Check your spam folder or try again.
                        </p>
                        <Link
                            href="/auth/signin"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-block mb-6">
                        <Image src="/logo.svg" alt="Fixelo" width={140} height={35} className="h-9 w-auto" />
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
                    <p className="text-gray-600">
                        No worries! Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                {...register('email')}
                                type="email"
                                autoComplete="email"
                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                                placeholder="john@example.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/auth/signin"
                            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
