'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Headphones, ShieldCheck, Star } from 'lucide-react';
import { SessionProvider } from 'next-auth/react';
import { BookingProgress } from '@/components/booking/booking-progress';

// Map paths to step numbers
const PATH_TO_STEP: Record<string, number> = {
    '/book': 1,
    '/book/details': 2,
    '/book/schedule': 3,
    '/book/auth': 4,
    '/book/address': 5,
    '/book/review': 6,
    '/book/checkout': 6,
    '/book/success': 7,
};

export default function BookLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const currentStep = PATH_TO_STEP[pathname] || 1;
    const isSuccess = pathname === '/book/success';

    return (
        <SessionProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                {/* Minimal Header */}
                <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <Logo />

                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 hidden md:flex">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span>Verified Cleaners</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span>Quality Guaranteed</span>
                            </div>
                        </div>

                        <a href="tel:+13215550123" className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors">
                            <Headphones className="w-4 h-4" />
                            <span className="hidden sm:inline">Help</span>
                        </a>
                    </div>
                </header>

                {/* Progress Bar - hide on success page */}
                {!isSuccess && (
                    <BookingProgress currentStep={currentStep} />
                )}

                {/* Main Content - Card Container */}
                <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
                    <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>

                {/* Trust Footer */}
                <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 bg-white">
                    <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                        <p>&copy; {new Date().getFullYear()} Fixelo Inc.</p>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure SSL Checkout</span>
                            <span className="flex items-center gap-1">Satisfaction Guaranteed</span>
                        </div>
                    </div>
                </footer>
            </div>
        </SessionProvider>
    );
}
