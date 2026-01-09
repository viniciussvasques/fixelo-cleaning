import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin?callbackUrl=/cleaner/onboarding');
    }

    // Check if user already has a cleaner profile
    const existingProfile = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (existingProfile) {
        // If approved, go to dashboard
        if (existingProfile.verificationStatus === 'APPROVED') {
            redirect('/cleaner/dashboard');
        }
        // If pending/under review, go to pending page
        if (existingProfile.submittedAt) {
            redirect('/cleaner/onboarding/pending');
        }
        // Otherwise continue to current step
        const stepMap: Record<number, string> = {
            1: '/cleaner/onboarding/account',
            2: '/cleaner/onboarding/identity',
            3: '/cleaner/onboarding/documents',
            4: '/cleaner/onboarding/social',
            5: '/cleaner/onboarding/banking',
        };
        redirect(stepMap[existingProfile.onboardingStep] || '/cleaner/onboarding/account');
    }

    // New user - start at step 1
    redirect('/cleaner/onboarding/account');
}
