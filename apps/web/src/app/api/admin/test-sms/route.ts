/**
 * Send Test SMS API
 * 
 * For testing Twilio integration during development.
 * Only available to admin users.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms';

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can send test SMS
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { phone, template, customMessage } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        let message = customMessage;

        // Use template if provided
        if (template && !customMessage) {
            switch (template) {
                case 'bookingConfirmation':
                    message = SMS_TEMPLATES.bookingConfirmation('Test User', 'Jan 15', '10:00 AM');
                    break;
                case 'cleanerAssigned':
                    message = SMS_TEMPLATES.cleanerAssigned('Test User', 'Maria S.');
                    break;
                case 'jobOffer':
                    message = SMS_TEMPLATES.jobOffer('Test Cleaner', 'Orlando, FL', 'Jan 15', 85);
                    break;
                default:
                    message = 'Hello from Fixelo! This is a test SMS.';
            }
        }

        if (!message) {
            message = 'Hello from Fixelo! This is a test SMS.';
        }

        const result = await sendSMS(phone, message);

        return NextResponse.json({
            success: result.success,
            messageId: result.messageId,
            error: result.error,
        });
    } catch (error) {
        console.error('[Test SMS] Error:', error);
        return NextResponse.json(
            { error: 'Failed to send SMS' },
            { status: 500 }
        );
    }
}
