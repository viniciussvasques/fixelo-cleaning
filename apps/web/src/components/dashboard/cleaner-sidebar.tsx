'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    Home,
    Briefcase,
    Calendar,
    Clock,
    DollarSign,
    User,
    Building,
    LogOut,
    Bell,
    HelpCircle,
    Settings,
    ChevronRight,
    Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: Home, label: 'Dashboard', href: '/cleaner/dashboard' },
    { icon: Briefcase, label: 'Jobs', href: '/cleaner/jobs', badge: true },
    { icon: Calendar, label: 'Schedule', href: '/cleaner/schedule' },
    { icon: Clock, label: 'Availability', href: '/cleaner/availability' },
    { icon: DollarSign, label: 'Earnings', href: '/cleaner/earnings' },
    { icon: Bell, label: 'Notifications', href: '/cleaner/notifications' },
];

const SECONDARY_ITEMS = [
    { icon: User, label: 'Profile', href: '/cleaner/profile' },
    { icon: Building, label: 'Banking', href: '/cleaner/banking' },
    { icon: HelpCircle, label: 'Support', href: '/cleaner/support' },
];

export function CleanerSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b">
                <Link href="/cleaner/dashboard" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-gray-900">Fixelo</span>
                        <span className="text-xs font-medium text-green-600 ml-1 bg-green-50 px-1.5 py-0.5 rounded">PRO</span>
                    </div>
                </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                        {user?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                            {user?.name || 'Pro Cleaner'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/cleaner/dashboard' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-green-50 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isActive && 'text-green-600')} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 text-green-400" />}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Account
                    </p>
                    <div className="space-y-1">
                        {SECONDARY_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    <item.icon className={cn('w-5 h-5', isActive && 'text-green-600')} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
