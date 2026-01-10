/**
 * Stripe Client with Dynamic Key Loading
 * 
 * Loads STRIPE_SECRET_KEY from database at runtime.
 * Falls back to environment variable if database is unavailable.
 * Uses short cache (30 seconds) to balance performance and responsiveness.
 */

import Stripe from 'stripe';
import { prisma } from '@fixelo/database';

// Cache for the secret key (short TTL for responsiveness)
let cachedSecretKey: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Gets the Stripe secret key from database or env fallback
 */
async function getStripeSecretKey(): Promise<string> {
    const now = Date.now();

    // Return cached key if still valid
    if (cachedSecretKey && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedSecretKey;
    }

    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'stripe_secret_key' },
            select: { value: true },
        });

        if (config?.value) {
            cachedSecretKey = config.value;
            cacheTimestamp = now;
            return config.value;
        }
    } catch (error) {
        console.error('[Stripe] Error fetching secret key from DB:', error);
    }

    // Fallback to environment variable
    const envKey = process.env.STRIPE_SECRET_KEY;
    if (envKey) {
        cachedSecretKey = envKey;
        cacheTimestamp = now;
        return envKey;
    }

    throw new Error('STRIPE_SECRET_KEY not configured in database or environment');
}

// Cache for Stripe instances per key
const stripeInstances = new Map<string, Stripe>();

/**
 * Gets a Stripe client instance with the current secret key
 * Creates new instance only when key changes
 */
export async function getStripeClient(): Promise<Stripe> {
    const secretKey = await getStripeSecretKey();

    // Return cached instance if key hasn't changed
    if (stripeInstances.has(secretKey)) {
        return stripeInstances.get(secretKey)!;
    }

    // Create new Stripe instance
    const stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
        typescript: true,
    });

    // Cache the instance
    stripeInstances.set(secretKey, stripe);

    return stripe;
}

/**
 * Clears the cached key (call after updating keys in admin panel)
 */
export function clearStripeCache(): void {
    cachedSecretKey = null;
    cacheTimestamp = 0;
    stripeInstances.clear();
}

// Legacy export for backwards compatibility (uses env var directly)
// TODO: Migrate all usages to getStripeClient()
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16',
    typescript: true,
});
