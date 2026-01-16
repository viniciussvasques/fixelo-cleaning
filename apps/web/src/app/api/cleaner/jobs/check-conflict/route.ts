/**
 * Check Job Conflict API
 * 
 * Verifies if cleaner has conflicting jobs in the same time window
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { AssignmentStatus, BookingStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookingId, cleanerId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        // Get the booking to check
        const targetBooking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                scheduledDate: true,
                timeWindow: true,
                estimatedDuration: true,
                arrivalWindowStart: true,
                arrivalWindowEnd: true
            }
        });

        if (!targetBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Get cleaner ID
        let targetCleanerId = cleanerId;
        if (!targetCleanerId) {
            const cleaner = await prisma.cleanerProfile.findUnique({
                where: { userId: session.user.id },
                select: { id: true }
            });
            if (!cleaner) {
                return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
            }
            targetCleanerId = cleaner.id;
        }

        // Parse time window to get start/end hours
        const [startTime, endTime] = targetBooking.timeWindow.split('-');
        const targetDate = new Date(targetBooking.scheduledDate);

        // Get all accepted jobs for this cleaner on the same day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAssignments = await prisma.cleanerAssignment.findMany({
            where: {
                cleanerId: targetCleanerId,
                status: AssignmentStatus.ACCEPTED,
                booking: {
                    id: { not: bookingId }, // Exclude the booking being checked
                    scheduledDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    status: {
                        notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED]
                    }
                }
            },
            include: {
                booking: {
                    select: {
                        id: true,
                        timeWindow: true,
                        estimatedDuration: true,
                        serviceType: { select: { name: true } }
                    }
                }
            }
        });

        // Check for overlapping time windows
        const conflicts: Array<{
            bookingId: string;
            timeWindow: string;
            serviceName: string;
        }> = [];

        const parseTime = (timeStr: string): number => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + (minutes || 0);
        };

        const targetStart = parseTime(startTime);
        const targetEnd = parseTime(endTime);

        for (const assignment of existingAssignments) {
            const [existingStart, existingEnd] = assignment.booking.timeWindow.split('-');
            const existingStartMin = parseTime(existingStart);
            const existingEndMin = parseTime(existingEnd);

            // Check for overlap
            // Overlap occurs if: targetStart < existingEnd AND targetEnd > existingStart
            if (targetStart < existingEndMin && targetEnd > existingStartMin) {
                conflicts.push({
                    bookingId: assignment.booking.id,
                    timeWindow: assignment.booking.timeWindow,
                    serviceName: assignment.booking.serviceType.name
                });
            }
        }

        return NextResponse.json({
            hasConflict: conflicts.length > 0,
            conflicts,
            targetTimeWindow: targetBooking.timeWindow,
            date: targetDate.toISOString().split('T')[0]
        });

    } catch (error) {
        console.error('[CheckConflict] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to check conflicts'
        }, { status: 500 });
    }
}
