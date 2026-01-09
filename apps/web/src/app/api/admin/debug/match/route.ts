import { NextResponse } from 'next/server';
import { findMatches } from '@/lib/matching';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get('bookingId');

        if (!bookingId) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }

        const matches = await findMatches(bookingId);

        return NextResponse.json({
            count: matches.length,
            matches: matches.map(m => ({
                cleanerId: m.cleaner.id,
                name: m.cleaner.userId, // In real app would fetch User name
                score: m.score.toFixed(2),
                distance: `${m.distance.toFixed(1)} km`,
                rating: m.cleaner.rating,
                acceptance: m.cleaner.acceptanceRate
            }))
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
