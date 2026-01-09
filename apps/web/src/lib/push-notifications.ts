/**
 * Push Notifications Service
 * 
 * Handles web push notifications using the Web Push API.
 * 
 * Setup:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Add to .env: NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
 */

import webpush from 'web-push';
import { prisma, Prisma } from '@fixelo/database';

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

// Configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@fixelo.app',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
    return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
}

/**
 * Store push subscription in database
 */
export async function storeSubscription(
    userId: string,
    subscription: object
): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            pushSubscription: subscription as object,
            pushEnabled: true,
        },
    });
    console.log(`[Push] Stored subscription for user ${userId}`);
}

/**
 * Remove push subscription
 */
export async function removeSubscription(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            pushSubscription: Prisma.DbNull,
            pushEnabled: false,
        },
    });
    console.log(`[Push] Removed subscription for user ${userId}`);
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
    userId: string,
    payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
    if (!isPushConfigured()) {
        console.log('[Push] Not configured, skipping. Payload:', payload.title);
        return { success: false, error: 'Push not configured' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pushSubscription: true, pushEnabled: true },
        });

        if (!user?.pushEnabled || !user.pushSubscription) {
            return { success: false, error: 'User has no active subscription' };
        }

        const subscription = user.pushSubscription as unknown as webpush.PushSubscription;

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

        console.log(`[Push] Sent to user ${userId}: ${payload.title}`);
        return { success: true };
    } catch (error) {
        console.error('[Push] Error:', error);

        // If subscription expired, remove it
        const err = error as { statusCode?: number };
        if (err.statusCode === 410) {
            await removeSubscription(userId);
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToMultiple(
    userIds: string[],
    payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
        const result = await sendPushNotification(userId, payload);
        if (result.success) {
            sent++;
        } else {
            failed++;
        }
    }

    return { sent, failed };
}

// ============== Notification Templates ==============

export const PUSH_TEMPLATES = {
    newJobOffer: (address: string, payout: number) => ({
        title: '🏠 New Job Available!',
        body: `${address} - Est. $${payout.toFixed(0)}`,
        icon: '/logo.png',
        url: '/cleaner/jobs',
        tag: 'job-offer',
    }),

    bookingConfirmed: (date: string) => ({
        title: '✅ Booking Confirmed!',
        body: `Your cleaning is scheduled for ${date}.`,
        icon: '/logo.png',
        url: '/customer/bookings',
        tag: 'booking',
    }),

    cleanerOnTheWay: (cleanerName: string) => ({
        title: '🚗 Cleaner On The Way!',
        body: `${cleanerName} is heading to your location.`,
        icon: '/logo.png',
        tag: 'status',
    }),

    paymentReceived: (amount: number) => ({
        title: '💰 Payment Received!',
        body: `$${amount.toFixed(2)} added to your earnings.`,
        icon: '/logo.png',
        url: '/cleaner/earnings',
        tag: 'payment',
    }),

    newMessage: (senderName: string) => ({
        title: '💬 New Message',
        body: `${senderName} sent you a message.`,
        icon: '/logo.png',
        tag: 'message',
    }),
};
