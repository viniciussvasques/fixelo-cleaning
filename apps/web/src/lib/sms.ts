/**
 * Twilio SMS Service with Dynamic Configuration
 * 
 * Loads Twilio configuration from database at runtime.
 * Falls back to environment variables if database is unavailable.
 */

import twilio from 'twilio';
import { prisma } from '@fixelo/database';

// Cache for Twilio config
interface TwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
}

let cachedTwilioConfig: TwilioConfig | null = null;
let twilioConfigCacheTimestamp = 0;
const TWILIO_CONFIG_CACHE_TTL = 30 * 1000; // 30 seconds

// Cache for Twilio client
let cachedTwilioClient: twilio.Twilio | null = null;
let cachedClientConfig: string | null = null;

/**
 * Gets Twilio configuration from database or env fallback
 */
async function getTwilioConfig(): Promise<TwilioConfig> {
    const now = Date.now();

    // Return cached config if still valid
    if (cachedTwilioConfig && (now - twilioConfigCacheTimestamp) < TWILIO_CONFIG_CACHE_TTL) {
        return cachedTwilioConfig;
    }

    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    in: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number']
                }
            },
            select: { key: true, value: true }
        });

        const configMap = new Map(configs.map(c => [c.key, c.value]));

        // Build config from database or fallback to env
        const config: TwilioConfig = {
            accountSid: configMap.get('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID || '',
            authToken: configMap.get('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN || '',
            phoneNumber: configMap.get('twilio_phone_number') || process.env.TWILIO_PHONE_NUMBER || '',
        };

        cachedTwilioConfig = config;
        twilioConfigCacheTimestamp = now;
        return config;
    } catch (error) {
        console.error('[SMS] Error fetching Twilio config from DB:', error);

        // Fallback to environment variables
        const config: TwilioConfig = {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        };

        cachedTwilioConfig = config;
        twilioConfigCacheTimestamp = now;
        return config;
    }
}

/**
 * Gets or creates a Twilio client with current config
 */
async function getTwilioClient(): Promise<twilio.Twilio | null> {
    const config = await getTwilioConfig();

    if (!config.accountSid || !config.authToken) {
        return null;
    }

    const configKey = `${config.accountSid}:${config.authToken}`;

    // Return cached client if config hasn't changed
    if (cachedTwilioClient && cachedClientConfig === configKey) {
        return cachedTwilioClient;
    }

    // Create new client
    cachedTwilioClient = twilio(config.accountSid, config.authToken);
    cachedClientConfig = configKey;
    return cachedTwilioClient;
}

/**
 * Clears the cached Twilio config (call after updating in admin panel)
 */
export function clearTwilioConfigCache(): void {
    cachedTwilioConfig = null;
    twilioConfigCacheTimestamp = 0;
    cachedTwilioClient = null;
    cachedClientConfig = null;
}

interface SendSMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send SMS message
 */
export async function sendSMS(to: string, body: string): Promise<SendSMSResult> {
    const config = await getTwilioConfig();
    const client = await getTwilioClient();

    if (!client || !config.phoneNumber) {
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
            from: config.phoneNumber,
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
