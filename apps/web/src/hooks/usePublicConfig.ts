/**
 * Public Config Hook
 * 
 * Fetches public configuration from the API at runtime.
 * This allows config to be loaded from the database instead of build-time env vars.
 * 
 * Uses SWR-like caching pattern for optimal performance.
 */

'use client';

import { useEffect, useState } from 'react';

export interface PublicConfig {
    stripePublishableKey: string;
    appUrl: string;
    vapidPublicKey: string;
    googleMapsApiKey: string;
}

// Global cache shared across all hook instances
let globalConfigCache: PublicConfig | null = null;
let globalConfigPromise: Promise<PublicConfig> | null = null;

/**
 * Fetches public config from the API
 * Implements singleton pattern to avoid multiple simultaneous requests
 */
async function fetchPublicConfig(): Promise<PublicConfig> {
    // Return cached config if available
    if (globalConfigCache) {
        return globalConfigCache;
    }

    // Return existing promise if fetch is in progress
    if (globalConfigPromise) {
        return globalConfigPromise;
    }

    // Start new fetch
    globalConfigPromise = fetch('/api/config/public', {
        next: { revalidate: 300 }, // Cache for 5 minutes
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch config');
            }
            return res.json();
        })
        .then(config => {
            globalConfigCache = config;
            return config;
        })
        .catch(error => {
            console.error('[usePublicConfig] Error fetching config:', error);
            // Return fallback config on error
            return {
                stripePublishableKey: '',
                appUrl: 'https://fixelo.app',
                vapidPublicKey: '',
                googleMapsApiKey: '',
            };
        })
        .finally(() => {
            // Clear promise after 5 minutes to allow refresh
            setTimeout(() => {
                globalConfigPromise = null;
            }, 5 * 60 * 1000);
        });

    return globalConfigPromise;
}

/**
 * Hook to access public configuration
 * 
 * @example
 * const { config, isLoading } = usePublicConfig();
 * if (isLoading) return <Spinner />;
 * const stripe = loadStripe(config.stripePublishableKey);
 */
export function usePublicConfig() {
    const [config, setConfig] = useState<PublicConfig | null>(globalConfigCache);
    const [isLoading, setIsLoading] = useState(!globalConfigCache);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (globalConfigCache) {
            setConfig(globalConfigCache);
            setIsLoading(false);
            return;
        }

        fetchPublicConfig()
            .then(setConfig)
            .catch(setError)
            .finally(() => setIsLoading(false));
    }, []);

    return { config, isLoading, error };
}

/**
 * Server-side function to get public config
 * For use in Server Components
 */
export async function getPublicConfig(): Promise<PublicConfig> {
    // In server context, try to fetch from API
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/config/public`, {
            cache: 'force-cache',
            next: { revalidate: 300 },
        });

        if (res.ok) {
            return res.json();
        }
    } catch {
        // Fallback to env vars in server context
    }

    // Fallback for server-side
    return {
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app',
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    };
}

/**
 * Pre-fetch config (call in layout or early in the app)
 */
export function prefetchPublicConfig(): void {
    if (typeof window !== 'undefined') {
        fetchPublicConfig();
    }
}
