/**
 * Check Late Arrivals Cron Job
 * 
 * Runs every 15 minutes to:
 * 1. Alert cleaners who are about to be late
 * 2. Redistribute jobs from cleaners who are significantly late
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { AssignmentStatus, BookingStatus } from '@prisma/client';
import { sendSMSNotification } from '@/lib/sms';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) return true; // Allow if no secret configured
    return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
    // Verify cron authentication
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const alerts: string[] = [];
        const redistributed: string[] = [];

        // Get all accepted assignments for today where cleaner hasn't checked in
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const upcomingJobs = await prisma.cleanerAssignment.findMany({
            where: {
                status: AssignmentStatus.ACCEPTED,
                booking: {
                    scheduledDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    status: {
                        in: [BookingStatus.PENDING, BookingStatus.ASSIGNED, BookingStatus.ACCEPTED]
                    }
                }
            },
            include: {
                cleaner: {
                    include: {
                        user: { select: { phone: true, firstName: true, id: true } }
                    }
                },
                booking: {
                    include: {
                        address: true,
                        serviceType: true,
                        user: { select: { phone: true, firstName: true, id: true } },
                        jobExecution: true
                    }
                }
            }
        });

        for (const assignment of upcomingJobs) {
            const booking = assignment.booking;
            const jobExecution = booking.jobExecution;

            // Skip if already checked in
            if (jobExecution?.checkedInAt) continue;

            // Parse time window
            const [startTime] = booking.timeWindow.split('-');
            const [hours, minutes] = startTime.split(':').map(Number);

            const arrivalDeadline = new Date(booking.scheduledDate);
            arrivalDeadline.setHours(hours, minutes || 0, 0, 0);

            // Add tolerance (from booking or default 30 min)
            const toleranceMinutes = booking.arrivalWindowMinutes || 30;
            const finalDeadline = new Date(arrivalDeadline.getTime() + toleranceMinutes * 60000);

            const minutesUntilDeadline = Math.floor((arrivalDeadline.getTime() - now.getTime()) / 60000);
            const minutesPastFinalDeadline = Math.floor((now.getTime() - finalDeadline.getTime()) / 60000);

            // Alert: 15 minutes before deadline
            if (minutesUntilDeadline <= 15 && minutesUntilDeadline > 0) {
                // Send warning to cleaner
                const cleanerPhone = assignment.cleaner.user.phone;
                if (cleanerPhone) {
                    try {
                        await sendSMSNotification(
                            assignment.cleaner.user.id,
                            cleanerPhone,
                            `⚠️ Reminder: You have a job starting in ${minutesUntilDeadline} minutes at ${booking.address?.street || 'address on file'}. Please head there now!`,
                            { bookingId: booking.id, type: 'ARRIVAL_WARNING' }
                        );
                        alerts.push(`Warned cleaner ${assignment.cleaner.user.firstName} for booking ${booking.id}`);
                    } catch (e) {
                        console.error('Failed to send warning SMS:', e);
                    }
                }
            }

            // Redistribute: 30+ minutes past final deadline
            if (minutesPastFinalDeadline >= 30) {
                // Mark current assignment as EXPIRED
                await prisma.cleanerAssignment.update({
                    where: { id: assignment.id },
                    data: { status: AssignmentStatus.EXPIRED }
                });

                // Update cleaner metrics
                await prisma.cleanerProfile.update({
                    where: { id: assignment.cleanerId },
                    data: {
                        totalLateArrivals: { increment: 1 },
                        punctualityRate: {
                            decrement: 0.05 // Reduce punctuality rate
                        }
                    }
                });

                // Find new cleaner
                const availableCleaners = await prisma.cleanerProfile.findMany({
                    where: {
                        id: { not: assignment.cleanerId },
                        verificationStatus: 'APPROVED',
                        status: 'ACTIVE',
                        // Check they don't have conflicting jobs
                        assignments: {
                            none: {
                                status: AssignmentStatus.ACCEPTED,
                                booking: {
                                    scheduledDate: booking.scheduledDate,
                                    status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] }
                                }
                            }
                        }
                    },
                    orderBy: [
                        { punctualityRate: 'desc' },
                        { qualityScore: 'desc' }
                    ],
                    take: 5,
                    include: {
                        user: { select: { phone: true, firstName: true, id: true } }
                    }
                });

                if (availableCleaners.length > 0) {
                    // Create new pending assignment for best available cleaner
                    const newCleaner = availableCleaners[0];

                    await prisma.cleanerAssignment.create({
                        data: {
                            bookingId: booking.id,
                            cleanerId: newCleaner.id,
                            status: AssignmentStatus.PENDING,
                            expiresAt: new Date(Date.now() + 30 * 60000) // 30 min to accept
                        }
                    });

                    // Notify new cleaner
                    if (newCleaner.user.phone) {
                        try {
                            await sendSMSNotification(
                                newCleaner.user.id,
                                newCleaner.user.phone,
                                `🚨 URGENT: A cleaning job is available NOW at ${booking.address?.city || 'your area'}. Accept quickly!`,
                                { bookingId: booking.id, type: 'URGENT_JOB' }
                            );
                        } catch (e) {
                            console.error('Failed to notify new cleaner:', e);
                        }
                    }

                    redistributed.push(`Booking ${booking.id}: from ${assignment.cleaner.user.firstName} to ${newCleaner.user.firstName}`);
                }

                // Notify customer about delay
                if (booking.user.phone) {
                    try {
                        await sendSMSNotification(
                            booking.user.id,
                            booking.user.phone,
                            `Hi ${booking.user.firstName}, we're sorry but your original cleaner is unavailable. We're assigning a new cleaner and will update you shortly.`,
                            { bookingId: booking.id, type: 'CLEANER_REASSIGNED' }
                        );
                    } catch (e) {
                        console.error('Failed to notify customer:', e);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            processed: upcomingJobs.length,
            alerts,
            redistributed
        });

    } catch (error) {
        console.error('[CheckLateArrivals] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to check late arrivals'
        }, { status: 500 });
    }
}

// GET for easy testing
export async function GET(request: NextRequest) {
    return POST(request);
}
