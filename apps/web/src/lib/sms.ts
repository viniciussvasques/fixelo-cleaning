/**
 * Twilio SMS Integration
 * 
 * Send SMS notifications via Twilio.
 * Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
 */

import twilio from 'twilio';
import { prisma } from '@fixelo/database';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface SendSMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send SMS message
 */
export async function sendSMS(to: string, body: string): Promise<SendSMSResult> {
    if (!client || !fromNumber) {
        console.warn('[SMS] Twilio not configured, skipping SMS');
        return { success: false, error: 'Twilio not configured' };
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(to);
    if (!normalizedPhone) {
        return { success: false, error: 'Invalid phone number' };
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromNumber,
            to: normalizedPhone,
        });

        console.log(`[SMS] Sent to ${normalizedPhone}: ${message.sid}`);
        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('[SMS] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // US numbers
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    // Already international format
    if (digits.length >= 11) {
        return `+${digits}`;
    }

    return null;
}

// ============== SMS Templates ==============

export const SMS_TEMPLATES = {
    bookingConfirmation: (customerName: string, date: string, time: string) =>
        `Hi ${customerName}! Your Fixelo cleaning is confirmed for ${date} at ${time}. We'll send you cleaner details soon. Reply HELP for support.`,

    cleanerAssigned: (customerName: string, cleanerName: string) =>
        `Great news ${customerName}! ${cleanerName} will be your cleaner. You can track their arrival in the app. - Fixelo`,

    jobOffer: (cleanerName: string, address: string, date: string, payout: number) =>
        `Hey ${cleanerName}! New job: ${address} on ${date}. Est. payout: $${payout.toFixed(0)}. Accept in the app within 15 min!`,

    jobReminder: (name: string, time: string) =>
        `Reminder: Your Fixelo cleaning is in 1 hour (${time}). See you soon! - Fixelo`,

    paymentReceived: (cleanerName: string, amount: number) =>
        `${cleanerName}, you've earned $${amount.toFixed(2)} from your last job! Payout will be in your bank within 2-3 business days. - Fixelo`,
};

// ============== Send Notification ==============

/**
 * Send SMS notification and log to database
 */
export async function sendSMSNotification(
    userId: string,
    phone: string,
    message: string,
    metadata?: Record<string, unknown>
): Promise<SendSMSResult> {
    const result = await sendSMS(phone, message);

    // Log notification in database
    try {
        await prisma.notification.create({
            data: {
                userId,
                type: 'SMS',
                subject: 'SMS Notification',
                body: message,
                sentAt: result.success ? new Date() : null,
                twilioSid: result.messageId || null,
            },
        });
    } catch (error) {
        console.error('[SMS] Failed to log notification:', error);
    }

    return result;
}
