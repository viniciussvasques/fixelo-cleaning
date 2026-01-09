import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submit error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
