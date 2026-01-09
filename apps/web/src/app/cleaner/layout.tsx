import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { CleanerSidebar } from "@/components/dashboard/cleaner-sidebar";

export default async function CleanerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/cleaner/dashboard");
    }

    if (session.user.role !== UserRole.CLEANER && session.user.role !== UserRole.ADMIN) {
        redirect("/");
    }

    return (
        <SessionProvider>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <CleanerSidebar />

                {/* Main Content */}
                <main className="flex-1 lg:ml-64">
                    {/* Page Content */}
                    <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
                        {children}
                    </div>
                </main>
            </div>
        </SessionProvider>
    );
}
