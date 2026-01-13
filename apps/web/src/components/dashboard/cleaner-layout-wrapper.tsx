'use client';

import { usePathname } from 'next/navigation';
import { CleanerSidebar } from './cleaner-sidebar';
import { CleanerBottomNav } from './cleaner-bottom-nav';
import { CleanerMobileHeader } from './cleaner-mobile-header';

export function CleanerLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Don't show navigation on onboarding pages
    const isOnboarding = pathname?.includes('/cleaner/onboarding');

    if (isOnboarding) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
                <CleanerSidebar />
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
                <CleanerMobileHeader />
            </div>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
                <div className="p-4 pt-16 lg:pt-8 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation - Only on mobile */}
            <div className="lg:hidden">
                <CleanerBottomNav />
            </div>
        </div>
    );
}
