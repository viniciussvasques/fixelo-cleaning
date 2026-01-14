import { NextResponse } from 'next/server';
import { checkAndProcessNoShows } from '@/lib/no-show';
import { prisma } from '@fixelo/database';

export const dynamic = 'force-dynamic';

/**
 * Get CRON_SECRET from database or env fallback
 */
async function getCronSecret(): Promise<string | null> {
    // Try database first
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'cron_secret' },
            select: { value: true }
        });
        if (config?.value) return config.value;
    } catch {
        // Database error, fall back to env
    }
    // Fallback to env var
    return process.env.CRON_SECRET || null;
}

/**
 * Cron Job: Check for No-Show Cleaners
 * 
 * Should be triggered every 5 minutes by external cron service
 * (e.g., Vercel Cron, Railway Cron, or external service like cron-job.org)
 * 
 * Endpoint: GET /api/cron/check-no-shows
 * 
 * Security: Requires CRON_SECRET in Authorization header or query param
 */
export async function GET(request: Request) {
    // Get cron secret from database or env
    const CRON_SECRET = await getCronSecret();

    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');

    const providedSecret = authHeader?.replace('Bearer ', '') || querySecret;

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
        console.log('[CRON] Unauthorized access attempt to check-no-shows');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting no-show check...');

    try {
        const results = await checkAndProcessNoShows();

        console.log(`[CRON] No-show check completed. Processed ${results.length} assignments`);

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CRON] Error checking no-shows:', error);
        return NextResponse.json({
            error: 'Failed to process no-shows',
            details: String(error)
        }, { status: 500 });
    }
}
