/**
 * Push Subscription API
 * 
 * Register and manage push notification subscriptions.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    getVapidPublicKey,
    isPushConfigured,
    storeSubscription,
    removeSubscription
} from '@/lib/push-notifications';

/**
 * GET - Get VAPID public key for subscription
 */
export async function GET() {
    if (!isPushConfigured()) {
        return NextResponse.json(
            { configured: false, message: 'Push notifications not configured' },
            { status: 200 }
        );
    }

    return NextResponse.json({
        configured: true,
        publicKey: getVapidPublicKey(),
    });
}

/**
 * POST - Save push subscription
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription' },
                { status: 400 }
            );
        }

        await storeSubscription(
            session.user.id,
            subscription
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push] Error saving subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Remove push subscription
 */
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await removeSubscription(session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push] Error removing subscription:', error);
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        );
    }
}
