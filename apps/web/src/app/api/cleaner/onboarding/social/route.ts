import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const socialSchema = z.object({
    linkedinProfile: z.string().optional(),
    instagramHandle: z.string().optional(),
    websiteUrl: z.string().optional(),
    references: z.array(z.object({
        name: z.string().min(2, 'Reference name is required'),
        phone: z.string().min(10, 'Valid phone number required'),
        relationship: z.string().min(2, 'Relationship is required'),
    })).min(2, 'At least 2 references are required'),
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

        const body = await req.json();
        const validation = socialSchema.safeParse(body);

        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: firstError.message, field: firstError.path.join('.') } },
                { status: 400 }
            );
        }

        const { linkedinProfile, instagramHandle, websiteUrl, references } = validation.data;

        const profile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!profile) {
            return NextResponse.json(
                { error: { code: 'PROFILE_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        // Update cleaner profile with social links
        await prisma.cleanerProfile.update({
            where: { id: profile.id },
            data: {
                linkedinProfile: linkedinProfile || null,
                instagramHandle: instagramHandle || null,
                websiteUrl: websiteUrl || null,
                onboardingStep: 5,
            }
        });

        // Delete existing references and create new ones
        await prisma.cleanerReference.deleteMany({
            where: { cleanerId: profile.id }
        });

        await prisma.cleanerReference.createMany({
            data: references.map(ref => ({
                cleanerId: profile.id,
                name: ref.name,
                phone: ref.phone,
                relationship: ref.relationship,
            }))
        });

        return NextResponse.json({
            success: true,
            message: 'Social information and references saved successfully'
        });
    } catch (error) {
        console.error('[Social] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to save social information' } },
            { status: 500 }
        );
    }
}
