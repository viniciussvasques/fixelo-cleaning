import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Find user with valid reset token
        // Note: Requires resetToken and resetTokenExpiry fields in User model
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 12);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({
            message: 'Password has been reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Failed to reset password. Please try again.' },
            { status: 500 }
        );
    }
}
