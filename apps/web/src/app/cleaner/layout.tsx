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
        // Onboarding pages are now at /onboarding/cleaner/* (outside /cleaner layout)
        if (!cleanerProfile || !cleanerProfile.onboardingCompleted) {
            const step = cleanerProfile?.onboardingStep || 1;
            const stepRoutes: Record<number, string> = {
                1: '/onboarding/cleaner/account',
                2: '/onboarding/cleaner/identity',
                3: '/onboarding/cleaner/documents',
                4: '/onboarding/cleaner/social',
                5: '/onboarding/cleaner/banking',
            };
            redirect(stepRoutes[step] || '/onboarding/cleaner/account');
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

