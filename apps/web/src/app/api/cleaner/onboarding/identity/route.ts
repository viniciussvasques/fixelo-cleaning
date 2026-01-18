import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const identitySchema = z.object({
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    businessType: z.enum(['INDIVIDUAL', 'COMPANY']),
    taxIdType: z.enum(['SSN', 'ITIN', 'EIN']),
    taxIdValue: z.string().min(4, 'Tax ID is required'),
    photoIdType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID']),
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Parse FormData
        const formData = await req.formData();
        const dateOfBirth = formData.get('dateOfBirth') as string;
        const businessType = formData.get('businessType') as string;
        const taxIdType = formData.get('taxIdType') as string;
        const taxIdValue = formData.get('taxIdValue') as string;
        const photoIdType = formData.get('photoIdType') as string;
        const idDocumentFront = formData.get('idDocumentFront') as File | null;
        const idDocumentBack = formData.get('idDocumentBack') as File | null;
        const profilePhoto = formData.get('profilePhoto') as File | null;

        // Validate with Zod
        const validation = identitySchema.safeParse({
            dateOfBirth,
            businessType,
            taxIdType,
            taxIdValue,
            photoIdType
        });

        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: firstError.message, field: firstError.path[0] } },
                { status: 400 }
            );
        }

        // Cross-validate business type and tax ID type
        if (taxIdType === 'EIN' && businessType !== 'COMPANY') {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'EIN is only valid for companies', field: 'taxIdType' } },
                { status: 400 }
            );
        }

        if ((taxIdType === 'SSN' || taxIdType === 'ITIN') && businessType === 'COMPANY') {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Companies must use EIN', field: 'taxIdType' } },
                { status: 400 }
            );
        }

        if (!idDocumentFront) {
            return NextResponse.json(
                { error: { code: 'MISSING_DOCUMENT', message: 'ID document front is required', field: 'idDocumentFront' } },
                { status: 400 }
            );
        }

        if (!idDocumentBack) {
            return NextResponse.json(
                { error: { code: 'MISSING_DOCUMENT', message: 'ID document back is required', field: 'idDocumentBack' } },
                { status: 400 }
            );
        }

        if (!profilePhoto) {
            return NextResponse.json(
                { error: { code: 'MISSING_DOCUMENT', message: 'Profile photo is required', field: 'profilePhoto' } },
                { status: 400 }
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

        // Upload documents to S3
        const { uploadFileToS3, UPLOAD_FOLDERS } = await import('@/lib/s3');

        let idDocumentFrontUrl = '';
        let idDocumentBackUrl = '';
        let profilePhotoUrl = '';

        try {
            const frontResult = await uploadFileToS3(
                idDocumentFront,
                UPLOAD_FOLDERS.CLEANER_DOCUMENTS,
                session.user.id
            );
            idDocumentFrontUrl = frontResult.url;

            const backResult = await uploadFileToS3(
                idDocumentBack,
                UPLOAD_FOLDERS.CLEANER_DOCUMENTS,
                session.user.id
            );
            idDocumentBackUrl = backResult.url;

            const photoResult = await uploadFileToS3(
                profilePhoto,
                UPLOAD_FOLDERS.PROFILE_PHOTOS,
                session.user.id
            );
            profilePhotoUrl = photoResult.url;
        } catch (uploadError) {
            console.error('[Identity] S3 upload error:', uploadError);
            return NextResponse.json(
                { error: { code: 'UPLOAD_FAILED', message: 'Failed to upload documents. Please try again.' } },
                { status: 500 }
            );
        }

        // Prepare data based on tax ID type
        const updateData: Record<string, unknown> = {
            businessType,
            taxIdType,
            photoIdType,
            idDocumentUrl: idDocumentFrontUrl,
            photoIdBackUrl: idDocumentBackUrl,
            profileImage: profilePhotoUrl,
            onboardingStep: 3,
        };

        // Store tax ID value in appropriate field
        if (taxIdType === 'EIN') {
            updateData.ein = taxIdValue; // Store full EIN for companies
        } else if (taxIdType === 'ITIN') {
            updateData.itin = taxIdValue; // Store last 4 of ITIN
        } else if (taxIdType === 'SSN') {
            updateData.ssnLast4 = taxIdValue; // Store last 4 of SSN
        }

        // Update profile with identity info
        // TODO: In production, encrypt sensitive tax IDs before storing
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            message: 'Identity information saved successfully'
        });
    } catch (error) {
        console.error('[Identity] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to save identity information' } },
            { status: 500 }
        );
    }
}
