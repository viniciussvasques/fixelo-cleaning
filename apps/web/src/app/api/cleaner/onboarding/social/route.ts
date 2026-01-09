import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const socialSchema = z.object({
    linkedinProfile: z.string().optional(),
    instagramHandle: z.string().optional(),
    websiteUrl: z.string().optional(),
    references: z.array(z.object({
        name: z.string().min(2),
        phone: z.string().min(10),
        relationship: z.string().min(2),
    })).min(2),
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = socialSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid data', errors: validation.error.errors }, { status: 400 });
        }

        const { linkedinProfile, instagramHandle, websiteUrl, references } = validation.data;

        const profile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Social step error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
