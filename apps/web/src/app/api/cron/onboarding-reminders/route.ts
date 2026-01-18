/**
 * Automatic Onboarding Reminder System
 * 
 * Cron endpoint called periodically (e.g., every 24h) to:
 * 1. Find cleaners with incomplete onboarding (not already reminded recently)
 * 2. Send targeted reminder emails based on their current step
 * 3. Track when reminders were sent to avoid spam
 * 
 * Called by: Vercel Cron, external scheduler, or admin trigger
 * Auth: API key in header for automated calls, or admin session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { sendEmailNotification } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET || 'fixelo-cron-secret';

// Email templates per onboarding step
const stepTemplates: Record<number, { subject: string; title: string; message: string }> = {
    1: {
        subject: '📝 Complete Your Fixelo Account Setup',
        title: 'Finish Setting Up Your Account',
        message: 'You started registering as a Fixelo Pro but haven\'t completed your account information.',
    },
    2: {
        subject: '🪪 Verify Your Identity on Fixelo',
        title: 'Identity Verification Required',
        message: 'Please upload your government-issued ID to continue with your Fixelo Pro registration.',
    },
    3: {
        subject: '📄 Upload Your Documents to Fixelo',
        title: 'Documents Needed',
        message: 'Please upload your required documents (Photo ID, Insurance) to complete your profile.',
    },
    4: {
        subject: '📱 Add Your Social Profiles on Fixelo',
        title: 'Complete Your Profile',
        message: 'Add your professional references and social profiles to boost your credibility.',
    },
    5: {
        subject: '🏦 Set Up Your Payment Method on Fixelo',
        title: 'Banking Information Required',
        message: 'Add your banking information to receive payments for completed jobs.',
    },
};

export async function GET(request: NextRequest) {
    try {
        // Verify authentication (cron secret or admin)
        const authHeader = request.headers.get('authorization');
        const cronSecret = request.headers.get('x-cron-secret');

        // Allow if cron secret matches
        const isValidCron = cronSecret === CRON_SECRET;

        if (!isValidCron && !authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find cleaners with incomplete onboarding who haven't been reminded in last 48 hours
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const incompleteCleaners = await prisma.cleanerProfile.findMany({
            where: {
                onboardingCompleted: false,
                OR: [
                    { lastReminderSentAt: null },
                    { lastReminderSentAt: { lt: fortyEightHoursAgo } },
                ],
            },
            include: { user: true },
            take: 50, // Limit per run to avoid overwhelming
        });

        const results = {
            total: incompleteCleaners.length,
            sent: 0,
            errors: 0,
            details: [] as Array<{ email: string; step: number; status: string }>,
        };

        for (const cleaner of incompleteCleaners) {
            const step = cleaner.onboardingStep || 1;
            const template = stepTemplates[step] || stepTemplates[1];

            try {
                await sendEmailNotification(cleaner.userId, {
                    to: cleaner.user.email,
                    subject: template.subject,
                    html: `
                        <h1>Hello ${cleaner.user.firstName}!</h1>
                        <h2>${template.title}</h2>
                        <p>${template.message}</p>
                        
                        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p style="margin: 0;"><strong>Your Progress:</strong> Step ${step} of 5</p>
                        </div>
                        
                        <p>Complete your registration now to start receiving job offers and earning money!</p>
                        
                        <p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding/cleaner" 
                               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Continue Registration
                            </a>
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                            Need help? Reply to this email or contact support@fixelo.app
                        </p>
                        
                        <p>Best regards,<br/>The Fixelo Team</p>
                    `,
                });

                // Update last reminder timestamp
                await prisma.cleanerProfile.update({
                    where: { id: cleaner.id },
                    data: { lastReminderSentAt: new Date() },
                });

                results.sent++;
                results.details.push({
                    email: cleaner.user.email,
                    step,
                    status: 'sent'
                });

            } catch (error) {
                console.error(`Error sending reminder to ${cleaner.user.email}:`, error);
                results.errors++;
                results.details.push({
                    email: cleaner.user.email,
                    step,
                    status: 'error'
                });
            }
        }

        console.log(`[Onboarding Reminders] Sent ${results.sent}/${results.total}, Errors: ${results.errors}`);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.total} cleaners`,
            results,
        });

    } catch (error) {
        console.error('[Onboarding Reminders] Error:', error);
        return NextResponse.json(
            { error: 'Failed to process reminders' },
            { status: 500 }
        );
    }
}

// Also support POST for manual trigger from admin
export async function POST(request: NextRequest) {
    return GET(request);
}
