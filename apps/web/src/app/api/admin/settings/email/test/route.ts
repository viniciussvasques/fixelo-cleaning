/**
 * Test Email Endpoint
 * 
 * Sends a test email to verify SMTP configuration is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
        }

        // Send test email
        await sendEmail({
            to: email,
            subject: '✅ Fixelo Email Test - Configuration Working!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3b82f6;">🎉 Email Configuration Test</h1>
                    <p>This is a test email from your Fixelo admin panel.</p>
                    <p><strong>If you're seeing this, your email configuration is working correctly!</strong></p>
                    
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Test Details:</strong></p>
                        <p style="margin: 5px 0;">• Sent at: ${new Date().toLocaleString()}</p>
                        <p style="margin: 5px 0;">• Recipient: ${email}</p>
                    </div>
                    
                    <p>Your SMTP settings are configured properly and emails can be sent from your Fixelo platform.</p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        This is an automated test message from Fixelo Admin Panel.
                    </p>
                </div>
            `,
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent successfully to ${email}`
        });
    } catch (error) {
        console.error('[Test Email] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
