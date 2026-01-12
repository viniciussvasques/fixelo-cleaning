import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const profile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!profile) {
            return NextResponse.json(
                { error: { code: 'PROFILE_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        // Validate that all onboarding steps are complete
        if (profile.onboardingStep < 5) {
            return NextResponse.json(
                { error: { code: 'INCOMPLETE_ONBOARDING', message: 'Please complete all onboarding steps before submitting' } },
                { status: 400 }
            );
        }

        // Mark onboarding as complete and submit for review
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: {
                onboardingCompleted: true,
                verificationStatus: 'PENDING',
                submittedAt: new Date(),
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully. We will review and get back to you within 2-3 business days.'
        });
    } catch (error) {
        console.error('[Submit] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit application' } },
            { status: 500 }
        );
    }
}
