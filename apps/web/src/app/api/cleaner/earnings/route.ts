import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Fetch completed bookings for calculations
        const bookings = await prisma.booking.findMany({
            where: {
                assignments: {
                    some: {
                        cleanerId: cleaner.id,
                        status: 'ACCEPTED'
                    }
                },
                status: 'COMPLETED'
            },
            select: {
                id: true,
                totalPrice: true,
                scheduledDate: true,
                payoutStatus: true,
                serviceType: { select: { name: true } }
            },
            orderBy: { scheduledDate: 'desc' }
        });

        // Mock Calculation Logic (Server-side should ideally use the FinancialSettings)
        // Platform Fee 15%, Insurance 2% = 17% deduction approx.
        // Let's implement a consistent calculator helper in the future.
        const PROVIDER_SHARE = 0.83;

        const calculateNet = (amount: number) => amount * PROVIDER_SHARE;

        let thisWeek = 0;
        let thisMonth = 0;
        let lifetime = 0;
        let pending = 0;

        const pendingEarnings = [];

        for (const booking of bookings) {
            const net = calculateNet(booking.totalPrice);
            const date = new Date(booking.scheduledDate);

            lifetime += net;

            if (date >= weekStart && date <= weekEnd) {
                thisWeek += net;
            }
            if (date >= monthStart && date <= monthEnd) {
                thisMonth += net;
            }

            if (booking.payoutStatus === 'PENDING') {
                pending += net;
                pendingEarnings.push({
                    id: booking.id,
                    date: booking.scheduledDate,
                    service: booking.serviceType.name,
                    amount: net,
                    status: 'PENDING'
                });
            }
        }

        // Fetch Payouts
        const payouts = await prisma.payout.findMany({
            where: { cleanerId: cleaner.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json({
            stats: {
                thisWeek,
                thisMonth,
                pending,
                lifetime
            },
            pendingEarnings,
            payouts
        });

    } catch (error) {
        console.error('Earnings error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
