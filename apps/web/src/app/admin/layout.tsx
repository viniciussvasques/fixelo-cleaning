import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Users,
    Settings,
    Package,
    Calendar,
    LogOut
} from "lucide-react";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/services', icon: Package, label: 'Services' },
    { href: '/admin/services/addons', icon: Package, label: 'Add-ons' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        redirect("/");
    }

    return (
        <div className="flex h-screen bg-[var(--background)]">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#0F172A] text-white hidden md:flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/admin" className="flex items-center gap-2">
                        <Image
                            src="/logo.svg"
                            alt="Fixelo"
                            width={130}
                            height={35}
                            className="h-8 w-auto brightness-0 invert"
                        />
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <item.icon className="w-5 h-5 group-hover:text-[var(--primary)]" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User */}
                <div className="p-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                            {session.user.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                        </div>
                        <Link href="/api/auth/signout" className="p-2 text-gray-400 hover:text-white transition-colors">
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Navigation */}
                <AdminMobileNav
                    userName={session.user.name || 'Admin'}
                    userEmail={session.user.email || ''}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

