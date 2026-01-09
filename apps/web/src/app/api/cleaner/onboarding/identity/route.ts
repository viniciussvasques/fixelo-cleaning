import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // For MVP, we accept FormData but don't actually upload to S3 yet
        // In production, use multer or similar to handle file uploads
        const formData = await req.formData();
        const dateOfBirth = formData.get('dateOfBirth') as string;
        const ssnLast4 = formData.get('ssnLast4') as string;
        const photoIdType = formData.get('photoIdType') as string;
        // const idDocument = formData.get('idDocument') as File; // Would upload to S3

        if (!dateOfBirth || !ssnLast4 || !photoIdType) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const profile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
        }

        // Update profile with identity info
        // In production: encrypt SSN, upload ID to S3, store URL
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: {
                ssnLast4: ssnLast4, // Should be encrypted in production
                photoIdType: photoIdType,
                idDocumentUrl: '/placeholder-id-doc.pdf', // Would be S3 URL
                onboardingStep: 3,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Identity step error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
