import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = changePasswordSchema.parse(body);

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isValid = await compare(validatedData.currentPassword, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await hash(validatedData.newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Password change error:', error);
        return NextResponse.json(
            { error: 'Failed to change password' },
            { status: 500 }
        );
    }
}
