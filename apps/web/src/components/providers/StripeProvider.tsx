/**
 * Stripe Provider
 * 
 * Wraps Stripe Elements with dynamic configuration loaded from the API.
 * This allows the Stripe publishable key to be configured via the admin panel.
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { Loader2 } from 'lucide-react';

interface StripeProviderProps {
    children: ReactNode;
    clientSecret?: string;
    options?: Omit<StripeElementsOptions, 'clientSecret'>;
}

// Global Stripe promise cache
let stripePromiseCache: Promise<Stripe | null> | null = null;
let cachedPublishableKey: string | null = null;

/**
 * Gets or creates a Stripe instance
 */
function getStripePromise(publishableKey: string): Promise<Stripe | null> {
    if (stripePromiseCache && cachedPublishableKey === publishableKey) {
        return stripePromiseCache;
    }

    if (!publishableKey) {
        console.error('[StripeProvider] No Stripe publishable key provided');
        return Promise.resolve(null);
    }

    cachedPublishableKey = publishableKey;
    stripePromiseCache = loadStripe(publishableKey);
    return stripePromiseCache;
}

/**
 * Stripe Provider Component
 * 
 * @example
 * <StripeProvider clientSecret={clientSecret}>
 *   <PaymentElement />
 * </StripeProvider>
 */
export function StripeProvider({ children, clientSecret, options }: StripeProviderProps) {
    const { config, isLoading, error } = usePublicConfig();
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

    useEffect(() => {
        if (config?.stripePublishableKey) {
            setStripePromise(getStripePromise(config.stripePublishableKey));
        }
    }, [config?.stripePublishableKey]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading payment system...</span>
            </div>
        );
    }

    // Error state
    if (error || !config?.stripePublishableKey) {
        return (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
                <p className="text-destructive">
                    Payment system is not configured. Please contact support.
                </p>
            </div>
        );
    }

    // Waiting for Stripe to load
    if (!stripePromise) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Initializing payment...</span>
            </div>
        );
    }

    // If clientSecret is required but not provided, show error
    if (!clientSecret) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                <p className="text-yellow-800">
                    Waiting for payment session...
                </p>
            </div>
        );
    }

    const elementsOptions = {
        clientSecret,
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#dc2626',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                borderRadius: '8px',
            },
            rules: {
                '.Input': {
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                },
                '.Input:focus': {
                    border: '1px solid #2563eb',
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                },
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={elementsOptions}>
            {children}
        </Elements>
    );
}

/**
 * Hook to get Stripe instance directly
 * For advanced use cases outside of Elements
 */
export function useStripe() {
    const { config, isLoading, error } = usePublicConfig();
    const [stripe, setStripe] = useState<Stripe | null>(null);

    useEffect(() => {
        if (config?.stripePublishableKey) {
            getStripePromise(config.stripePublishableKey).then(setStripe);
        }
    }, [config?.stripePublishableKey]);

    return {
        stripe,
        isLoading,
        error,
        publishableKey: config?.stripePublishableKey,
    };
}
