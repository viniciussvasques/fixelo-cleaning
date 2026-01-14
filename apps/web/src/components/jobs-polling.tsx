'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface JobsPollingProps {
    intervalMs?: number;
}

/**
 * Component that triggers page refresh at regular intervals
 * to keep job listings up to date
 */
export function JobsPolling({ intervalMs = 30000 }: JobsPollingProps) {
    const router = useRouter();

    const refresh = useCallback(() => {
        router.refresh();
    }, [router]);

    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [refresh, intervalMs]);

    // This component renders nothing, just handles polling
    return null;
}
