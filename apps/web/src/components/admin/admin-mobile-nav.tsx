'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    LayoutDashboard,
    Users,
    Settings,
    Package,
    Menu,
    Calendar,
    X,
    LogOut
} from 'lucide-react';

const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/services', icon: Package, label: 'Services' },
    { href: '/admin/services/addons', icon: Package, label: 'Add-ons' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface AdminMobileNavProps {
    userName: string;
    userEmail: string;
}

export function AdminMobileNav({ userName, userEmail }: AdminMobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
                <Link href="/admin" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Fixelo" width={100} height={30} className="h-7 w-auto" />
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar */}
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F172A] text-white flex flex-col animate-in slide-in-from-left duration-300">
                        {/* Logo */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <Link href="/admin" onClick={() => setIsOpen(false)}>
                                <Image
                                    src="/logo.svg"
                                    alt="Fixelo"
                                    width={130}
                                    height={35}
                                    className="h-8 w-auto brightness-0 invert"
                                />
                            </Link>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 py-6 overflow-y-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                                >
                                    <item.icon className="w-5 h-5 group-hover:text-blue-400" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* User */}
                        <div className="p-6 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                    {userName?.charAt(0) || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{userName}</p>
                                    <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                                </div>
                                <Link
                                    href="/api/auth/signout"
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
