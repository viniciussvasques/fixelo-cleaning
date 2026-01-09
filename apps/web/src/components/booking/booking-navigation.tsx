'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingNavigationProps {
    backHref?: string;
    backLabel?: string;
    nextLabel?: string;
    isLoading?: boolean;
    onNext?: () => void;
    showNext?: boolean;
    className?: string;
}

export function BookingNavigation({
    backHref,
    backLabel = 'Back',
    nextLabel = 'Continue',
    isLoading = false,
    onNext,
    showNext = true,
    className,
}: BookingNavigationProps) {
    const router = useRouter();

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    return (
        <div className={cn('flex items-center justify-between pt-6', className)}>
            {/* Back Button */}
            <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
            </button>

            {/* Next Button */}
            {showNext && (
                <button
                    type={onNext ? 'button' : 'submit'}
                    onClick={onNext}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Loading...' : nextLabel}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}

// Predefined step navigation mapping
export const BOOKING_NAV_MAP = {
    '/book': { back: '/', next: '/book/details' },
    '/book/details': { back: '/book', next: '/book/schedule' },
    '/book/schedule': { back: '/book/details', next: '/book/auth' },
    '/book/auth': { back: '/book/schedule', next: '/book/address' },
    '/book/address': { back: '/book/auth', next: '/book/addons' },
    '/book/addons': { back: '/book/address', next: '/book/review' },
    '/book/review': { back: '/book/addons', next: '/book/checkout' },
    '/book/checkout': { back: '/book/review', next: null },
};
