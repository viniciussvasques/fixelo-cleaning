/**
 * Public Config API
 * 
 * Returns public configuration keys from the database.
 * This allows frontend to load config at runtime instead of build time.
 * 
 * IMPORTANT: Only returns values from database, never from build-time env vars.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';

// Cache configuration - 30 seconds TTL for quick updates after admin changes
let configCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds for responsiveness

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
                    'Cache-Control': 'public, max-age=30',
                },
            });
        }

        // Fetch from database - THIS IS THE ONLY SOURCE OF TRUTH
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: [...PUBLIC_CONFIG_KEYS] },
            },
            select: {
                key: true,
                value: true,
            },
        });

        // Build config object from database ONLY
        const stripeKey = configs.find(c => c.key === 'stripe_publishable_key')?.value || '';

        // Log for debugging (remove after confirmed working)
        if (!stripeKey) {
            console.warn('[Config API] stripe_publishable_key not found in database! Please configure in Admin Panel.');
        }

        const config: Record<string, string> = {
            stripePublishableKey: stripeKey,
            appUrl: configs.find(c => c.key === 'next_public_app_url')?.value || 'https://fixelo.app',
            vapidPublicKey: configs.find(c => c.key === 'next_public_vapid_public_key')?.value || '',
            googleMapsApiKey: configs.find(c => c.key === 'next_public_google_maps_api_key')?.value || '',
        };

        // Update cache
        configCache = config;
        cacheTimestamp = now;

        return NextResponse.json(config, {
            headers: {
                'Cache-Control': 'public, max-age=30',
            },
        });
    } catch (error) {
        console.error('[Config API] Error fetching public config:', error);

        // On error, return empty config - do NOT use build-time env vars
        return NextResponse.json({
            stripePublishableKey: '',
            appUrl: 'https://fixelo.app',
            vapidPublicKey: '',
            googleMapsApiKey: '',
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-cache',
            },
        });
    }
}

