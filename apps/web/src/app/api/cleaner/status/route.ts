import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({
                exists: false,
                connected: false,
                status: 'NONE'
            });
        }

        return NextResponse.json({
            exists: true,
            status: cleaner.status,
            connected: !!cleaner.stripeAccountId,
            stripeAccountId: cleaner.stripeAccountId,
            onboardingCompleted: cleaner.onboardingCompleted
        });

    } catch (_error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
