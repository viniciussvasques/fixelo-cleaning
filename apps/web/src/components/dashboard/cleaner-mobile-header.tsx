'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Settings, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const PAGE_TITLES: Record<string, string> = {
    '/cleaner/dashboard': 'Dashboard',
    '/cleaner/jobs': 'Jobs',
    '/cleaner/schedule': 'My Schedule',
    '/cleaner/earnings': 'Earnings',
    '/cleaner/profile': 'Profile',
    '/cleaner/banking': 'Banking',
    '/cleaner/notifications': 'Notifications',
    '/cleaner/support': 'Support',
};

export function CleanerMobileHeader() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // Detect scroll for header shadow
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/notifications/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count || 0);
                }
            } catch {
                // Ignore errors
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    const isSubPage = pathname && !Object.keys(PAGE_TITLES).includes(pathname);
    const pageTitle = PAGE_TITLES[pathname || ''] || getSubPageTitle(pathname);

    function getSubPageTitle(path: string | null): string {
        if (!path) return 'Fixelo Pro';
        if (path.includes('/jobs/')) return 'Job Details';
        if (path.includes('/support')) return 'Support';
        return 'Fixelo Pro';
    }

    const isDashboard = pathname === '/cleaner/dashboard';

    return (
        <header className={`fixed top-0 left-0 right-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left Side */}
                <div className="flex items-center gap-3">
                    {isSubPage ? (
                        <button 
                            onClick={() => window.history.back()}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    ) : isDashboard ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {session?.user?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Welcome back</p>
                                <p className="font-semibold text-sm leading-tight">
                                    {session?.user?.name?.split(' ')[0] || 'Pro'}
                                </p>
                            </div>
                        </div>
                    ) : null}
                    
                    {!isDashboard && !isSubPage && (
                        <h1 className="text-lg font-bold">{pageTitle}</h1>
                    )}
                    
                    {isSubPage && (
                        <h1 className="text-lg font-semibold">{pageTitle}</h1>
                    )}
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center gap-1">
                    <Link 
                        href="/cleaner/notifications"
                        className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link 
                        href="/cleaner/profile"
                        className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-700" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
