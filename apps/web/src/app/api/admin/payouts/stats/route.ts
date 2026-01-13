/**
 * Admin Payout Stats API
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole, BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;

        // Get pending payouts
        const pendingBookings = await prisma.booking.findMany({
            where: {
                status: BookingStatus.COMPLETED,
                payoutStatus: 'PENDING',
            },
            select: { totalPrice: true }
        });

        // Calculate pending amounts
        const totalPending = pendingBookings.reduce((sum, b) => {
            const net = b.totalPrice * (1 - 0.029) - 0.30;
            return sum + net * (1 - platformFeePercent - insuranceFeePercent);
        }, 0);

        // Get paid this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const paidThisWeek = await prisma.booking.aggregate({
            where: {
                status: BookingStatus.COMPLETED,
                payoutStatus: 'PAID',
                updatedAt: { gte: weekStart },
            },
            _sum: { totalPrice: true },
            _count: true,
        });

        // Get paid this month
        const monthStart = new Date();
        monthStart.setDate(1);

        const paidThisMonth = await prisma.booking.aggregate({
            where: {
                status: BookingStatus.COMPLETED,
                payoutStatus: 'PAID',
                updatedAt: { gte: monthStart },
            },
            _sum: { totalPrice: true },
        });

        // Calculate averages
        const avgBase = (paidThisWeek._sum.totalPrice || 0) / Math.max(1, paidThisWeek._count);
        const avgPayout = avgBase * (1 - 0.029 - platformFeePercent - insuranceFeePercent);

        return NextResponse.json({
            totalPending: Math.round(totalPending * 100) / 100,
            totalPendingCount: pendingBookings.length,
            totalPaidThisWeek: Math.round((paidThisWeek._sum.totalPrice || 0) * (1 - platformFeePercent - insuranceFeePercent) * 100) / 100,
            totalPaidThisMonth: Math.round((paidThisMonth._sum.totalPrice || 0) * (1 - platformFeePercent - insuranceFeePercent) * 100) / 100,
            avgPayoutAmount: Math.round(avgPayout * 100) / 100,
        });

    } catch (error) {
        console.error('[PayoutStats] error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
