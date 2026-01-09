import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const accountSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().min(10),
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = accountSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Account step error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
