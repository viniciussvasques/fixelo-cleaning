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

            // TODO: Implement email sending with Resend
            // For now, log the reset URL for development
            console.log(`Password reset link for ${email}: ${resetUrl}`);

            // Example with Resend (uncomment when configured):
            // const { Resend } = await import('resend');
            // const resend = new Resend(process.env.RESEND_API_KEY);
            // await resend.emails.send({
            //   from: 'Fixelo <noreply@fixelo.com>',
            //   to: email,
            //   subject: 'Reset your Fixelo password',
            //   html: `<p>Hi ${user.firstName},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
            // });
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
