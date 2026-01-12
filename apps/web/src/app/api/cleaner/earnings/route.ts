import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json(
                { error: { code: 'CLEANER_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Get financial settings from database
        const financialSettings = await prisma.financialSettings.findFirst();
        const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;

        // Calculate provider share (what cleaner keeps after fees)
        const PROVIDER_SHARE = 1 - platformFeePercent - insuranceFeePercent;

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

        const calculateNet = (amount: number) => amount * PROVIDER_SHARE;

        let thisWeek = 0;
        let thisMonth = 0;
        let lifetime = 0;
        let pending = 0;

        const pendingEarnings: Array<{
            id: string;
            date: Date;
            service: string;
            amount: number;
            status: string;
        }> = [];

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
            payouts,
            // Include breakdown info for transparency
            feeBreakdown: {
                platformFeePercent,
                insuranceFeePercent,
                cleanerSharePercent: PROVIDER_SHARE
            }
        });

    } catch (error) {
        console.error('[Earnings] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch earnings' } },
            { status: 500 }
        );
    }
}
