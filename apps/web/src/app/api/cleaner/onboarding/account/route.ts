import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const accountSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
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
        const validation = accountSchema.safeParse(body);

        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: firstError.message, field: firstError.path[0] } },
                { status: 400 }
            );
        }

        const { firstName, lastName, phone } = validation.data;

        // Update user profile
        await prisma.user.update({
            where: { id: session.user.id },
            data: { firstName, lastName, phone }
        });

        // Create or update cleaner profile
        const existingProfile = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (existingProfile) {
            await prisma.cleanerProfile.update({
                where: { id: existingProfile.id },
                data: { onboardingStep: 2 }
            });
        } else {
            await prisma.cleanerProfile.create({
                data: {
                    userId: session.user.id,
                    onboardingStep: 2,
                    verificationStatus: 'PENDING',
                }
            });

            // Update user role to CLEANER
            await prisma.user.update({
                where: { id: session.user.id },
                data: { role: 'CLEANER' }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Account information saved successfully'
        });
    } catch (error) {
        console.error('[Account] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to save account information' } },
            { status: 500 }
        );
    }
}
