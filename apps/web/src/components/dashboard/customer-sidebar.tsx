'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    Home,
    Calendar,
    User,
    MapPin,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Calendar, label: 'My Bookings', href: '/dashboard/bookings' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
    { icon: MapPin, label: 'Addresses', href: '/dashboard/addresses' },
    { icon: CreditCard, label: 'Payments', href: '/dashboard/payments' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function CustomerSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const user = session?.user;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
            >
                {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform lg:translate-x-0',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b">
                        <Link href="/" className="text-2xl font-bold text-blue-600">
                            Fixelo
                        </Link>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.name || 'Customer'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Book Now CTA */}
                    <div className="p-4 border-t">
                        <Link
                            href="/book"
                            className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Book a Cleaning
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-4 border-t">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
