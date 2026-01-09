import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
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

        // For MVP, we accept FormData but don't actually upload to S3 yet
        const formData = await req.formData();
        const insuranceDoc = formData.get('insuranceDoc') as File | null;

        // Update profile
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: {
                hasInsurance: !!insuranceDoc,
                insuranceDocUrl: insuranceDoc ? '/placeholder-insurance.pdf' : null, // Would be S3 URL
                onboardingStep: 4,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Documents step error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
