/**
 * Public Config API
 * 
 * Returns public configuration keys from the database.
 * This allows frontend to load config at runtime instead of build time.
 * 
 * Cached for 5 minutes to reduce database load.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';

// Cache configuration - 1 minute TTL for responsiveness
let configCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute for quick updates after admin changes

const PUBLIC_CONFIG_KEYS = [
    'stripe_publishable_key',
    'next_public_app_url',
    'next_public_vapid_public_key',
    'next_public_google_maps_api_key',
] as const;

export async function GET() {
    try {
        const now = Date.now();

        // Return cached config if still valid
        if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
            return NextResponse.json(configCache, {
                headers: {
                    'Cache-Control': 'public, max-age=300', // 5 minutes
                },
            });
        }

        // Fetch from database
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: [...PUBLIC_CONFIG_KEYS] },
            },
            select: {
                key: true,
                value: true,
            },
        });

        // Debug log to see what we're getting from database
        console.log('[Config API] Found configs from DB:', configs.map(c => ({ key: c.key, valueLen: c.value?.length })));

        // Build config object with fallbacks to environment variables
        const stripeKey = configs.find(c => c.key === 'stripe_publishable_key')?.value;
        console.log('[Config API] Stripe key from DB:', stripeKey ? `${stripeKey.substring(0, 20)}... (${stripeKey.length} chars)` : 'NOT FOUND');

        const config: Record<string, string> = {
            stripePublishableKey:
                stripeKey ||
                process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            appUrl:
                configs.find(c => c.key === 'next_public_app_url')?.value ||
                process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app',
            vapidPublicKey:
                configs.find(c => c.key === 'next_public_vapid_public_key')?.value ||
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            googleMapsApiKey:
                configs.find(c => c.key === 'next_public_google_maps_api_key')?.value ||
                process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        };

        // Update cache
        configCache = config;
        cacheTimestamp = now;

        return NextResponse.json(config, {
            headers: {
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (error) {
        console.error('[Config API] Error fetching public config:', error);

        // Return fallback from environment variables on error
        return NextResponse.json({
            stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app',
            vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        }, {
            headers: {
                'Cache-Control': 'public, max-age=60', // Shorter cache on error
            },
        });
    }
}
