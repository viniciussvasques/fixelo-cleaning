import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
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

        // Parse FormData
        const formData = await req.formData();
        const insuranceDoc = formData.get('insuranceDoc') as File | null;

        // TODO: In production, upload document to S3/Cloudinary
        // For MVP, we store a placeholder URL
        // Example production code:
        // let insuranceDocUrl = null;
        // if (insuranceDoc) {
        //     const uploadResult = await uploadToS3(insuranceDoc, `cleaners/${profile.id}/insurance`);
        //     insuranceDocUrl = uploadResult.url;
        // }
        const insuranceDocUrl = insuranceDoc ? `/uploads/placeholder-insurance-${profile.id}.pdf` : null;

        // Update profile
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: {
                hasInsurance: !!insuranceDoc,
                insuranceDocUrl: insuranceDocUrl,
                onboardingStep: 4,
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Documents saved successfully'
        });
    } catch (error) {
        console.error('[Documents] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to save documents' } },
            { status: 500 }
        );
    }
}
