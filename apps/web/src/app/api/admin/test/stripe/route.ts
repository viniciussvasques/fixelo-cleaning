/**
 * Stripe Test API
 * Tests Stripe connection by retrieving account balance
 */

import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST() {
    try {
        // Check admin auth
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Test Stripe connection
        const stripe = await getStripeClient();

        // Get account balance to verify connection
        const balance = await stripe.balance.retrieve();

        // Get account info
        const account = await stripe.accounts.retrieve();

        return NextResponse.json({
            success: true,
            message: 'Stripe connection successful',
            details: {
                accountId: account.id,
                accountType: account.type,
                country: account.country,
                defaultCurrency: account.default_currency,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                balance: {
                    available: balance.available.map(b => ({
                        amount: b.amount / 100,
                        currency: b.currency.toUpperCase()
                    })),
                    pending: balance.pending.map(b => ({
                        amount: b.amount / 100,
                        currency: b.currency.toUpperCase()
                    }))
                }
            }
        });
    } catch (error) {
        console.error('[Stripe Test] Error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to connect to Stripe',
            error: error instanceof Error ? error.name : 'UnknownError'
        }, { status: 500 });
    }
}
