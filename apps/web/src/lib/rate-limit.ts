/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API routes.
 * For production, should be replaced with Redis-based solution.
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
};

// Presets for different endpoints
export const RATE_LIMIT_PRESETS = {
    auth: { windowMs: 60 * 1000, maxRequests: 5 },      // 5 per minute for auth
    api: { windowMs: 60 * 1000, maxRequests: 60 },       // 60 per minute for general API
    webhook: { windowMs: 60 * 1000, maxRequests: 100 },  // 100 per minute for webhooks
    contact: { windowMs: 60 * 1000, maxRequests: 3 },    // 3 per minute for contact form
};

export function getClientIp(request: Request): string {
    // Try various headers for client IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback
    return 'unknown';
}

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitMap.get(key);

    // Clean up expired entries periodically
    if (rateLimitMap.size > 10000) {
        for (const [k, v] of rateLimitMap) {
            if (now > v.resetTime) {
                rateLimitMap.delete(k);
            }
        }
    }

    if (!entry || now > entry.resetTime) {
        // Create new entry
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitMap.set(key, entry);

        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs,
        };
    }

    // Increment count
    entry.count++;

    if (entry.count > config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

export function rateLimitResponse(resetIn: number): NextResponse {
    return NextResponse.json(
        {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(resetIn / 1000),
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil(resetIn / 1000)),
                'X-RateLimit-Remaining': '0',
            },
        }
    );
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
    handler: (request: Request) => Promise<NextResponse>,
    config: RateLimitConfig = DEFAULT_CONFIG
) {
    return async (request: Request): Promise<NextResponse> => {
        const clientIp = getClientIp(request);
        const endpoint = new URL(request.url).pathname;
        const identifier = `${clientIp}:${endpoint}`;

        const { success, remaining, resetIn } = checkRateLimit(identifier, config);

        if (!success) {
            return rateLimitResponse(resetIn);
        }

        const response = await handler(request);

        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));

        return response;
    };
}
