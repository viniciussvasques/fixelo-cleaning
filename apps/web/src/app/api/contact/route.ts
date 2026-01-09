import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: Request) {
    // Rate limiting (3 per minute)
    const clientIp = getClientIp(request);
    const { success, resetIn } = checkRateLimit(`contact:${clientIp}`, RATE_LIMIT_PRESETS.contact);
    if (!success) {
        return rateLimitResponse(resetIn);
    }

    try {
        const body = await request.json();
        const validatedData = contactSchema.parse(body);

        // Send emails
        const { sendEmail } = await import('@/lib/email');

        // Send notification to support team
        await sendEmail({
            to: process.env.SUPPORT_EMAIL || 'support@fixelo.app',
            subject: `[Contact Form] ${validatedData.subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>From:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${validatedData.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                <a href="mailto:${validatedData.email}">${validatedData.email}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${validatedData.subject}</td>
                        </tr>
                    </table>
                    <h3 style="color: #333; margin-top: 20px;">Message:</h3>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">
                        ${validatedData.message.replace(/\n/g, '<br>')}
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        Received at: ${new Date().toLocaleString()}
                    </p>
                </div>
            `,
        });

        // Send confirmation to user
        await sendEmail({
            to: validatedData.email,
            subject: 'We received your message - Fixelo',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Thank You for Contacting Us!</h1>
                    <p>Hi ${validatedData.name},</p>
                    <p>We've received your message and our team will get back to you within 24 hours.</p>
                    <p><strong>Your message regarding:</strong> "${validatedData.subject}"</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p>In the meantime, you can:</p>
                    <ul>
                        <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/book">Book a cleaning</a></li>
                        <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/about">Learn more about us</a></li>
                    </ul>
                    <p>Best regards,<br/>The Fixelo Team</p>
                </div>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent. We will get back to you within 24 hours.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Failed to send message. Please try again.' },
            { status: 500 }
        );
    }
}
