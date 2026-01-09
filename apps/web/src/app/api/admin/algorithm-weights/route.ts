import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

const WEIGHT_KEYS = [
    'match_weight_rating',
    'match_weight_distance',
    'match_weight_acceptance',
    'match_weight_punctuality',
];

const DEFAULT_WEIGHTS: Record<string, number> = {
    match_weight_rating: 0.4,
    match_weight_distance: 0.2,
    match_weight_acceptance: 0.2,
    match_weight_punctuality: 0.2,
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.systemConfig.findMany({
            where: { key: { in: WEIGHT_KEYS } }
        });

        const result: Record<string, number> = { ...DEFAULT_WEIGHTS };
        for (const config of configs) {
            result[config.key] = parseFloat(config.value);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('GET algorithm weights error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validate sum equals 1
        const sum = WEIGHT_KEYS.reduce((acc, key) => acc + (body[key] ?? 0), 0);
        if (Math.abs(sum - 1) > 0.01) {
            return NextResponse.json({ message: 'Weights must sum to 1.0' }, { status: 400 });
        }

        // Upsert each weight
        for (const key of WEIGHT_KEYS) {
            if (body[key] !== undefined) {
                await prisma.systemConfig.upsert({
                    where: { key },
                    create: { key, value: body[key].toString() },
                    update: { value: body[key].toString() },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST algorithm weights error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
