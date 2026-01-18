'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Circle, ArrowLeft } from 'lucide-react';

const steps = [
    { id: 1, name: 'Account', path: '/onboarding/cleaner/account' },
    { id: 2, name: 'Identity', path: '/onboarding/cleaner/identity' },
    { id: 3, name: 'Documents', path: '/onboarding/cleaner/documents' },
    { id: 4, name: 'Social & References', path: '/onboarding/cleaner/social' },
    { id: 5, name: 'Banking', path: '/onboarding/cleaner/banking' },
];

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const currentStepIndex = steps.findIndex(step => pathname?.includes(step.path));
    const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" />
                    </Link>
                    <div className="text-sm text-slate-500">
                        Become a Pro
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/become-a-pro"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Become a Pro
                </Link>

                {/* Progress Stepper */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.id
                                                ? 'bg-green-500 text-white'
                                                : currentStep === step.id
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                    : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                                            }`}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-sm border p-8">
                    {children}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-slate-500">
                    <p>Need help? Contact us at <a href="mailto:support@fixelo.app" className="text-blue-600 hover:underline">support@fixelo.app</a></p>
                </div>
            </div>
        </div>
    );
}
