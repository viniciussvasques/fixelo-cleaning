/**
 * Admin Payouts API
 * 
 * List payout records
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole, BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Get completed bookings with their payout status
        const bookings = await prisma.booking.findMany({
            where: {
                status: BookingStatus.COMPLETED,
                ...(status && status !== 'ALL' ? { payoutStatus: status } : {}),
            },
            include: {
                serviceType: { select: { name: true } },
                user: { select: { firstName: true, lastName: true } },
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: {
                        cleaner: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });

        // Get financial settings
        const settings = await prisma.financialSettings.findFirst();
        const platformFeePercent = settings?.platformFeePercent ?? 0.15;
        const insuranceFeePercent = settings?.insuranceFeePercent ?? 0.02;

        // Transform to payout records
        const payouts = bookings
            .filter(b => b.assignments.length > 0)
            .map(booking => {
                const cleaner = booking.assignments[0].cleaner;
                const totalPrice = booking.totalPrice;
                const stripeFee = totalPrice * 0.029 + 0.30;
                const netAfterStripe = totalPrice - stripeFee;
                const platformFee = netAfterStripe * platformFeePercent;
                const insuranceFee = netAfterStripe * insuranceFeePercent;
                const cleanerPayout = netAfterStripe - platformFee - insuranceFee;

                return {
                    id: booking.id,
                    cleanerId: cleaner.id,
                    cleaner: {
                        user: cleaner.user,
                        stripeAccountId: cleaner.stripeAccountId,
                    },
                    bookingId: booking.id,
                    booking: {
                        scheduledDate: booking.scheduledDate,
                        totalPrice: booking.totalPrice,
                        serviceType: booking.serviceType,
                    },
                    amount: cleanerPayout,
                    platformFee,
                    insuranceFee,
                    stripeFee,
                    status: booking.payoutStatus || 'PENDING',
                    stripeTransferId: null,
                    paidAt: null,
                    createdAt: booking.updatedAt,
                };
            });

        return NextResponse.json({ payouts });

    } catch (error) {
        console.error('[AdminPayouts] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }
}
