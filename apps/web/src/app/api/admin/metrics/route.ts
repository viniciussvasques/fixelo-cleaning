/**
 * Admin Metrics API
 * 
 * Returns financial metrics for the admin dashboard:
 * - Total revenue
 * - Platform earnings (commissions)
 * - Cleaner payouts
 * - Booking statistics
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole, BookingStatus } from '@prisma/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const today = startOfDay(now);
        const thisWeek = startOfWeek(now, { weekStartsOn: 1 });
        const thisMonth = startOfMonth(now);
        const thisYear = startOfYear(now);
        const last30Days = subDays(now, 30);
        const lastMonth = subMonths(now, 1);

        // Get financial settings
        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;
        const stripeFeePercent = settings?.stripeFeePercent ?? 0.029;
        const stripeFeeFixed = settings?.stripeFeeFixed ?? 0.30;

        // Get all completed bookings
        const completedBookings = await prisma.booking.findMany({
            where: { status: BookingStatus.COMPLETED },
            select: {
                id: true,
                totalPrice: true,
                tipAmount: true,
                scheduledDate: true,
                createdAt: true,
                payoutStatus: true,
            }
        });

        // Calculate metrics
        let totalRevenue = 0;
        let totalTips = 0;
        let platformEarnings = 0;
        let cleanerPayouts = 0;
        let stripeFees = 0;
        let insuranceFees = 0;

        let revenueToday = 0;
        let revenueThisWeek = 0;
        let revenueThisMonth = 0;
        let revenueThisYear = 0;
        let revenueLast30Days = 0;

        let bookingsToday = 0;
        let bookingsThisWeek = 0;
        let bookingsThisMonth = 0;
        let bookingsLast30Days = 0;

        for (const booking of completedBookings) {
            const total = booking.totalPrice;
            const tip = booking.tipAmount || 0;
            const date = new Date(booking.scheduledDate);

            // Calculate fee breakdown
            const stripeFeeSingle = (total * stripeFeePercent) + stripeFeeFixed;
            const netAfterStripe = total - stripeFeeSingle;
            const platformFee = netAfterStripe * platformFeePercent;
            const insuranceFee = netAfterStripe * insuranceFeePercent;
            const cleanerPayout = netAfterStripe - platformFee - insuranceFee;

            // Accumulate totals
            totalRevenue += total;
            totalTips += tip;
            platformEarnings += platformFee;
            cleanerPayouts += cleanerPayout;
            stripeFees += stripeFeeSingle;
            insuranceFees += insuranceFee;

            // Date-based metrics
            if (date >= today) {
                revenueToday += total;
                bookingsToday++;
            }
            if (date >= thisWeek) {
                revenueThisWeek += total;
                bookingsThisWeek++;
            }
            if (date >= thisMonth) {
                revenueThisMonth += total;
                bookingsThisMonth++;
            }
            if (date >= thisYear) {
                revenueThisYear += total;
            }
            if (date >= last30Days) {
                revenueLast30Days += total;
                bookingsLast30Days++;
            }
        }

        // Get pending bookings count
        const pendingBookings = await prisma.booking.count({
            where: { status: { in: ['PENDING', 'ASSIGNED', 'ACCEPTED'] } }
        });

        // Get active cleaners count
        const activeCleaners = await prisma.cleanerProfile.count({
            where: { status: 'ACTIVE' }
        });

        // Get total customers
        const totalCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER', isActive: true }
        });

        // Get pending payouts
        const pendingPayouts = await prisma.booking.count({
            where: {
                status: BookingStatus.COMPLETED,
                payoutStatus: 'PENDING'
            }
        });

        // Calculate averages
        const avgBookingValue = completedBookings.length > 0
            ? totalRevenue / completedBookings.length
            : 0;

        return NextResponse.json({
            // Revenue metrics
            revenue: {
                total: totalRevenue,
                today: revenueToday,
                thisWeek: revenueThisWeek,
                thisMonth: revenueThisMonth,
                thisYear: revenueThisYear,
                last30Days: revenueLast30Days,
            },
            // Platform earnings
            platformEarnings: {
                total: platformEarnings,
                percentage: platformFeePercent * 100,
            },
            // Cleaner payouts
            cleanerPayouts: {
                total: cleanerPayouts,
                pending: pendingPayouts,
            },
            // Fee breakdown
            fees: {
                stripe: stripeFees,
                insurance: insuranceFees,
                platform: platformEarnings,
            },
            // Tips
            tips: {
                total: totalTips,
            },
            // Booking metrics
            bookings: {
                completed: completedBookings.length,
                pending: pendingBookings,
                today: bookingsToday,
                thisWeek: bookingsThisWeek,
                thisMonth: bookingsThisMonth,
                last30Days: bookingsLast30Days,
                averageValue: avgBookingValue,
            },
            // User metrics
            users: {
                cleaners: activeCleaners,
                customers: totalCustomers,
            },
            // Settings for reference
            settings: {
                platformFeePercent: platformFeePercent * 100,
                insuranceFeePercent: insuranceFeePercent * 100,
                stripeFeePercent: stripeFeePercent * 100,
                stripeFeeFixed,
            }
        });

    } catch (error) {
        console.error('[AdminMetrics] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
