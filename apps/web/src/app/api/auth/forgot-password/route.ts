import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import crypto from 'crypto';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function POST(request: Request) {
    // Rate limiting
    const clientIp = getClientIp(request);
    const { success, resetIn } = checkRateLimit(`forgot-password:${clientIp}`, RATE_LIMIT_PRESETS.auth);
    if (!success) {
        return rateLimitResponse(resetIn);
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        // But only send email if user exists
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Store token in database
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry,
                },
            });

            // Send email with reset link
            const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

            // Send password reset email
            const { sendEmail } = await import('@/lib/email');
            await sendEmail({
                to: email,
                subject: 'Reset Your Fixelo Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #2563eb;">Reset Your Password</h1>
                        <p>Hi ${user.firstName},</p>
                        <p>We received a request to reset your Fixelo account password.</p>
                        <p>Click the button below to create a new password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Reset Password
                            </a>
                        </p>
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in 1 hour. If you didn't request a password reset, 
                            you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px;">
                            © ${new Date().getFullYear()} Fixelo. All rights reserved.
                        </p>
                    </div>
                `,
            });
        }

        // Always return success response
        return NextResponse.json({
            message: 'If an account exists with that email, a reset link has been sent.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process request. Please try again.' },
            { status: 500 }
        );
    }
}
