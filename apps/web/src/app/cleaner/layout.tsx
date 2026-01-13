import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { CleanerLayoutWrapper } from "@/components/dashboard/cleaner-layout-wrapper";

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
            <CleanerLayoutWrapper>
                {children}
            </CleanerLayoutWrapper>
        </SessionProvider>
    );
}
