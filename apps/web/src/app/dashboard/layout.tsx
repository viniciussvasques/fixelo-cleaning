import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Calendar, User, Settings, LogOut, Menu, MessageCircle, LifeBuoy, CreditCard } from 'lucide-react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
        { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
        { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6">
                    <div className="flex h-16 shrink-0 items-center">
                        <Link href="/">
                            <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" />
                        </Link>
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="mt-auto">
                                <Link
                                    href="/api/auth/signout"
                                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                                    Sign out
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="sticky top-0 z-40 lg:hidden bg-white border-b border-gray-200">
                <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6">
                    <Link href="/" className="flex-shrink-0">
                        <Image src="/logo.svg" alt="Fixelo" width={100} height={25} className="h-7 w-auto" />
                    </Link>
                    <div className="ml-auto">
                        <button type="button" className="-m-2.5 p-2.5 text-gray-700">
                            <span className="sr-only">Open sidebar</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="lg:pl-64">
                <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
                    {children}
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
                <nav className="flex justify-around items-center h-16">
                    {navigation.slice(0, 4).map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600"
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="hidden sm:inline">{item.name.split(' ')[0]}</span>
                        </Link>
                    ))}
                    <Link
                        href="/api/auth/signout"
                        className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-red-600"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="hidden sm:inline">Logout</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
