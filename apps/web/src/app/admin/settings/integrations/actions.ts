'use server';

import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Keys that can be configured
const INTEGRATION_KEYS = [
    'stripe_secret_key',
    'stripe_publishable_key',
    'stripe_webhook_secret',
    'twilio_account_sid',
    'twilio_auth_token',
    'twilio_phone_number',
    // SMTP email
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_password',
    'email_from',
    // Resend
    'resend_api_key',
    // Push
    'vapid_public_key',
    'vapid_private_key',
] as const;

type IntegrationKey = typeof INTEGRATION_KEYS[number];

// Mask sensitive values for display
function maskValue(value: string | null, type: 'key' | 'token' | 'phone' | 'email' | 'text'): string {
    if (!value) return '';

    switch (type) {
        case 'key':
            if (value.length <= 8) return '••••••••';
            return `${value.slice(0, 4)}••••${value.slice(-4)}`;
        case 'token':
            return '••••••••••••';
        case 'phone':
            if (value.length <= 4) return '••••••••';
            return `${value.slice(0, 4)}••••${value.slice(-2)}`;
        case 'email':
        case 'text':
            return value; // Don't mask these
        default:
            return '••••••••';
    }
}

// Get all integration configurations
export async function getIntegrationConfigs() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: [...INTEGRATION_KEYS] }
        }
    });

    const configMap: Record<string, { value: string; maskedValue: string; isSet: boolean }> = {};

    // Initialize with defaults
    INTEGRATION_KEYS.forEach(key => {
        configMap[key] = { value: '', maskedValue: '', isSet: false };
    });

    // Fill from database
    configs.forEach(config => {
        const key = config.key as IntegrationKey;
        const value = config.value;

        let maskType: 'key' | 'token' | 'phone' | 'email' | 'text' = 'key';
        if (key.includes('token') || key.includes('secret') || key.includes('password')) maskType = 'token';
        if (key.includes('phone')) maskType = 'phone';
        if (key.includes('email') || key === 'email_from') maskType = 'email';
        if (key === 'smtp_host' || key === 'smtp_port' || key === 'smtp_user') maskType = 'text';

        configMap[key] = {
            value: '', // Don't send actual value to client
            maskedValue: maskValue(value, maskType),
            isSet: !!value && value.length > 0,
        };
    });

    // Also check environment variables as fallback
    const envMapping: Record<string, string | undefined> = {
        stripe_secret_key: process.env.STRIPE_SECRET_KEY,
        stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
        twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
        twilio_auth_token: process.env.TWILIO_AUTH_TOKEN,
        twilio_phone_number: process.env.TWILIO_PHONE_NUMBER,
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_user: process.env.SMTP_USER,
        smtp_password: process.env.SMTP_PASSWORD,
        email_from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
        resend_api_key: process.env.RESEND_API_KEY,
        vapid_public_key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        vapid_private_key: process.env.VAPID_PRIVATE_KEY,
    };

    // Mark as set if env var exists and DB doesn't have it
    Object.entries(envMapping).forEach(([key, envValue]) => {
        if (envValue && !configMap[key]?.isSet) {
            configMap[key] = {
                value: '',
                maskedValue: '(from env)',
                isSet: true,
            };
        }
    });

    return configMap;
}

// Save integration configuration
export async function saveIntegrationConfig(key: string, value: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    if (!INTEGRATION_KEYS.includes(key as IntegrationKey)) {
        throw new Error('Invalid configuration key');
    }

    // Don't save empty values
    if (!value.trim()) {
        // Delete the config if exists
        await prisma.systemConfig.deleteMany({
            where: { key }
        });
        revalidatePath('/admin/settings/integrations');
        return { success: true, message: 'Configuration removed' };
    }

    await prisma.systemConfig.upsert({
        where: { key },
        update: {
            value: value.trim(),
            updatedBy: session.user.id,
        },
        create: {
            key,
            value: value.trim(),
            description: `Integration setting: ${key}`,
            updatedBy: session.user.id,
        },
    });

    revalidatePath('/admin/settings/integrations');
    return { success: true, message: 'Configuration saved' };
}

// Save multiple configs at once
export async function saveAllIntegrationConfigs(configs: Record<string, string>) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    const results: { key: string; success: boolean; message: string }[] = [];

    for (const [key, value] of Object.entries(configs)) {
        if (!INTEGRATION_KEYS.includes(key as IntegrationKey)) {
            results.push({ key, success: false, message: 'Invalid key' });
            continue;
        }

        // Skip empty values (keep existing)
        if (!value.trim()) {
            continue;
        }

        try {
            await prisma.systemConfig.upsert({
                where: { key },
                update: {
                    value: value.trim(),
                    updatedBy: session.user.id,
                },
                create: {
                    key,
                    value: value.trim(),
                    description: `Integration setting: ${key}`,
                    updatedBy: session.user.id,
                },
            });
            results.push({ key, success: true, message: 'Saved' });
        } catch (error) {
            results.push({ key, success: false, message: String(error) });
        }
    }

    revalidatePath('/admin/settings/integrations');
    return { success: true, results };
}

// Get a config value (for server-side use)
export async function getConfigValue(key: string): Promise<string | null> {
    const config = await prisma.systemConfig.findUnique({
        where: { key }
    });

    return config?.value || null;
}
