import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin?callbackUrl=/onboarding/cleaner');
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
        // If documents need resubmission
        if (existingProfile.verificationStatus === 'DOCUMENTS_NEEDED') {
            redirect('/onboarding/cleaner/documents-needed');
        }
        // If pending/under review, go to pending page
        if (existingProfile.submittedAt) {
            redirect('/onboarding/cleaner/pending');
        }
        // Otherwise continue to current step
        const stepMap: Record<number, string> = {
            1: '/onboarding/cleaner/account',
            2: '/onboarding/cleaner/identity',
            3: '/onboarding/cleaner/documents',
            4: '/onboarding/cleaner/social',
            5: '/onboarding/cleaner/banking',
        };
        redirect(stepMap[existingProfile.onboardingStep] || '/onboarding/cleaner/account');
    }

    // New user - start at step 1
    redirect('/onboarding/cleaner/account');
}
