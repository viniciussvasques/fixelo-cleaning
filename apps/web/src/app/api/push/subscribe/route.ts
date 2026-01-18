/**
 * Push Notifications Subscription API
 * 
 * Handles saving and removing push subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription, removePushSubscription, getVapidPublicKey } from '@/lib/push';

/**
 * GET - Get VAPID public key
 */
export async function GET() {
    const publicKey = await getVapidPublicKey();

    if (!publicKey || publicKey.length < 20) {
        return NextResponse.json(
            { error: 'Push notifications not configured' },
            { status: 503 }
        );
    }

    return NextResponse.json({ publicKey });
}

/**
 * POST - Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        await savePushSubscription(session.user.id, subscription);

        return NextResponse.json({ success: true, message: 'Subscribed to push notifications' });

    } catch (error) {
        console.error('[Push] Subscribe error:', error);
        return NextResponse.json(
            { error: 'Failed to subscribe' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
        }

        await removePushSubscription(endpoint);

        return NextResponse.json({ success: true, message: 'Unsubscribed from push notifications' });

    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
