import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
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

    // Check if cleaner has completed onboarding (skip for admins)
    if (session.user.role === UserRole.CLEANER) {
        const cleanerProfile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { onboardingCompleted: true, onboardingStep: true }
        });

        // If no profile or onboarding not completed, redirect to onboarding
        if (!cleanerProfile || !cleanerProfile.onboardingCompleted) {
            const step = cleanerProfile?.onboardingStep || 1;
            const stepRoutes: Record<number, string> = {
                1: '/cleaner/onboarding/account',
                2: '/cleaner/onboarding/identity',
                3: '/cleaner/onboarding/documents',
                4: '/cleaner/onboarding/social',
                5: '/cleaner/onboarding/banking',
            };
            redirect(stepRoutes[step] || '/cleaner/onboarding/account');
        }
    }

    return (
        <SessionProvider>
            <CleanerLayoutWrapper>
                {children}
            </CleanerLayoutWrapper>
        </SessionProvider>
    );
}
