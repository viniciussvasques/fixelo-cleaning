/**
 * Email Test API
 * Tests email connection by sending a test email
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        // Check admin auth
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get test email from request or use admin's email
        const body = await req.json().catch(() => ({}));
        const testEmail = body.email || session.user.email;

        // Get Email config from database
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name'] }
            }
        });

        const configMap = new Map(configs.map(c => [c.key, c.value]));
        const host = configMap.get('smtp_host');
        const port = configMap.get('smtp_port');
        const user = configMap.get('smtp_user');
        const password = configMap.get('smtp_password');
        const fromEmail = configMap.get('smtp_from_email');
        const fromName = configMap.get('smtp_from_name') || 'Fixelo';

        // Check for environment fallback
        const smtpHost = host || process.env.SMTP_HOST;
        const smtpPort = port || process.env.SMTP_PORT;
        const smtpUser = user || process.env.SMTP_USER;
        const smtpPassword = password || process.env.SMTP_PASSWORD;
        const smtpFrom = fromEmail || process.env.SMTP_FROM_EMAIL;

        if (!smtpHost || !smtpUser || !smtpPassword) {
            return NextResponse.json({
                success: false,
                message: 'Email (SMTP) not configured. Missing: ' +
                    [!smtpHost && 'SMTP Host', !smtpUser && 'SMTP User', !smtpPassword && 'SMTP Password']
                        .filter(Boolean).join(', ')
            }, { status: 400 });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '587'),
            secure: smtpPort === '465',
            auth: {
                user: smtpUser,
                pass: smtpPassword
            }
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        const info = await transporter.sendMail({
            from: `"${fromName}" <${smtpFrom || smtpUser}>`,
            to: testEmail,
            subject: '✅ Fixelo Test Email - Your email integration is working!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #22c55e;">✅ Email Integration Test</h1>
                    <p>This is a test email from your Fixelo admin panel.</p>
                    <p>If you're reading this, your email integration is configured correctly!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Sent from Fixelo Admin Panel<br>
                        ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            details: {
                host: smtpHost,
                port: smtpPort || '587',
                from: smtpFrom || smtpUser,
                to: testEmail,
                messageId: info.messageId
            }
        });
    } catch (error) {
        console.error('[Email Test] Error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send test email',
            error: error instanceof Error ? error.name : 'UnknownError'
        }, { status: 500 });
    }
}
