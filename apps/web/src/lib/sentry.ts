/**
 * Error Tracking Utility
 * 
 * Provides centralized error tracking. Uses console by default.
 * 
 * To enable Sentry:
 * 1. npx @sentry/wizard@latest -i nextjs
 * 2. This will set up sentry.client.config.ts and sentry.server.config.ts
 * 3. Use captureException from @sentry/nextjs directly in those files
 */

const isDev = process.env.NODE_ENV === 'development';

interface ErrorContext {
    [key: string]: unknown;
}

interface User {
    id: string;
    email?: string;
    role?: string;
}

// Store for current user (for logging context)
let currentUser: User | null = null;

/**
 * Initialize error tracking
 */
export function initErrorTracking(): void {
    console.info('[ErrorTracking] Initialized (console mode)');
    console.info('[ErrorTracking] To enable Sentry: npx @sentry/wizard@latest -i nextjs');
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: ErrorContext): void {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        context,
        user: currentUser,
        timestamp: new Date().toISOString(),
    };

    console.error('[Error]', errorInfo);

    // In production, this would be sent to Sentry
    // After running sentry wizard, replace with:
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error, { extra: context });
}

/**
 * Set current user for error context
 */
export function setUser(user: User | null): void {
    currentUser = user;
    if (isDev) {
        console.debug('[ErrorTracking] User set:', user?.id || 'null');
    }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
    message: string,
    category = 'app',
    data?: Record<string, unknown>
): void {
    if (isDev) {
        console.debug(`[Breadcrumb] [${category}] ${message}`, data || '');
    }
}

/**
 * Capture a message
 */
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
): void {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logFn(`[${level.toUpperCase()}] ${message}`);
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
): Promise<T> {
    return fn().catch((error: Error) => {
        captureException(error, context);
        throw error;
    });
}
