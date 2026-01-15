/**
 * Push Notifications Service
 * 
 * Handles Web Push notifications for real-time updates
 */

import webPush from 'web-push';
import { prisma } from '@fixelo/database';

// VAPID keys should be generated once and stored
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@fixelo.app';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
}

/**
 * Save push subscription for a user
 */
export async function savePushSubscription(userId: string, subscription: PushSubscription) {
    const subscriptionData = JSON.parse(JSON.stringify(subscription));

    await prisma.pushSubscription.upsert({
        where: {
            endpoint: subscriptionData.endpoint
        },
        create: {
            userId,
            endpoint: subscriptionData.endpoint,
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
        },
        update: {
            userId,
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
        }
    });
}

/**
 * Remove push subscription
 */
export async function removePushSubscription(endpoint: string) {
    await prisma.pushSubscription.deleteMany({
        where: { endpoint }
    });
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('[Push] VAPID keys not configured');
        return { success: false, error: 'VAPID keys not configured' };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
    });

    if (subscriptions.length === 0) {
        return { success: false, error: 'No push subscriptions found' };
    }

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webPush.sendNotification(
                    pushSubscription,
                    JSON.stringify({
                        title: payload.title,
                        body: payload.body,
                        icon: payload.icon || '/icons/icon-192x192.png',
                        badge: payload.badge || '/icons/badge-72x72.png',
                        data: {
                            url: payload.url || '/',
                            ...payload.data
                        },
                        tag: payload.tag
                    })
                );
                return { success: true, endpoint: sub.endpoint };
            } catch (error: any) {
                // If subscription is expired, remove it
                if (error.statusCode === 410) {
                    await removePushSubscription(sub.endpoint);
                }
                console.error('[Push] Error sending to', sub.endpoint, error);
                return { success: false, endpoint: sub.endpoint, error };
            }
        })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    return { success: successful > 0, sent: successful, total: subscriptions.length };
}

/**
 * Notify cleaner of new job
 */
export async function notifyCleanerNewJob(cleanerUserId: string, jobDetails: {
    serviceName: string;
    address: string;
    date: string;
    payout: number;
    bookingId: string;
}) {
    return sendPushNotification(cleanerUserId, {
        title: '💼 New Job Available!',
        body: `${jobDetails.serviceName} - $${jobDetails.payout.toFixed(0)} - ${jobDetails.date}`,
        url: `/cleaner/jobs/${jobDetails.bookingId}`,
        tag: 'new-job'
    });
}

/**
 * Notify customer that cleaner is on the way
 */
export async function notifyCustomerCleanerEnRoute(customerUserId: string, cleanerName: string, bookingId: string) {
    return sendPushNotification(customerUserId, {
        title: '🚗 Cleaner On The Way!',
        body: `${cleanerName} has started heading to your location.`,
        url: `/dashboard/bookings/${bookingId}`,
        tag: 'cleaner-enroute'
    });
}

/**
 * Notify customer that cleaner has arrived
 */
export async function notifyCustomerCleanerArrived(customerUserId: string, cleanerName: string, bookingId: string) {
    return sendPushNotification(customerUserId, {
        title: '✅ Cleaner Has Arrived!',
        body: `${cleanerName} has arrived at your location.`,
        url: `/dashboard/bookings/${bookingId}`,
        tag: 'cleaner-arrived'
    });
}

/**
 * Notify customer that job is complete
 */
export async function notifyCustomerJobComplete(customerUserId: string, bookingId: string) {
    return sendPushNotification(customerUserId, {
        title: '🎉 Cleaning Complete!',
        body: 'Your cleaning is finished. Please leave a review!',
        url: `/dashboard/bookings/${bookingId}`,
        tag: 'job-complete'
    });
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
}
