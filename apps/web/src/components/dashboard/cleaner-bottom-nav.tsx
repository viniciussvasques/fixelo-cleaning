'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Calendar, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: Home, label: 'Home', href: '/cleaner/dashboard' },
    { icon: Briefcase, label: 'Jobs', href: '/cleaner/jobs' },
    { icon: Calendar, label: 'Schedule', href: '/cleaner/schedule' },
    { icon: DollarSign, label: 'Earnings', href: '/cleaner/earnings' },
    { icon: User, label: 'Profile', href: '/cleaner/profile' },
];

export function CleanerBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
            <div className="flex items-center justify-around h-16">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || 
                        (item.href !== '/cleaner/dashboard' && pathname?.startsWith(item.href));
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors tap-highlight-none',
                                isActive ? 'text-green-600' : 'text-gray-500'
                            )}
                        >
                            <item.icon className={cn(
                                'w-6 h-6 mb-1 transition-transform',
                                isActive && 'scale-110'
                            )} />
                            <span className={cn(
                                'text-[10px] font-medium',
                                isActive && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-600" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
