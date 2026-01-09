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

        // TODO: Send email via Resend when configured
        // For now, log the contact form submission
        console.log('Contact form submission:', {
            name: validatedData.name,
            email: validatedData.email,
            subject: validatedData.subject,
            message: validatedData.message,
            timestamp: new Date().toISOString(),
        });

        // Example with Resend (uncomment when API key is configured):
        /*
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
    
        // Send notification to support team
        await resend.emails.send({
          from: 'Fixelo Contact <noreply@fixelo.com>',
          to: 'support@fixelo.com',
          subject: `Contact Form: ${validatedData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${validatedData.name} (${validatedData.email})</p>
            <p><strong>Subject:</strong> ${validatedData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
          `,
        });
    
        // Send confirmation to user
        await resend.emails.send({
          from: 'Fixelo <noreply@fixelo.com>',
          to: validatedData.email,
          subject: 'We received your message',
          html: `
            <p>Hi ${validatedData.name},</p>
            <p>Thank you for contacting Fixelo! We've received your message and will get back to you within 24 hours.</p>
            <p>Your message regarding: "${validatedData.subject}"</p>
            <br>
            <p>Best regards,</p>
            <p>The Fixelo Team</p>
          `,
        });
        */

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
