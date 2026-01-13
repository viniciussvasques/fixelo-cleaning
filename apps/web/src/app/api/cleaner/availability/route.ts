/**
 * Cleaner Availability API
 * Manages cleaner weekly schedule/availability
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const availabilitySchema = z.object({
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    isActive: z.boolean(),
});

const updateAvailabilitySchema = z.array(availabilitySchema);

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            include: { availability: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        // Transform to a map for easier frontend use
        const availabilityMap: Record<string, { isActive: boolean; startTime: string; endTime: string }> = {};
        
        for (const slot of cleaner.availability) {
            availabilityMap[slot.dayOfWeek] = {
                isActive: slot.isActive,
                startTime: slot.startTime,
                endTime: slot.endTime,
            };
        }

        // Fill in missing days with defaults
        const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        for (const day of DAYS) {
            if (!availabilityMap[day]) {
                availabilityMap[day] = {
                    isActive: false,
                    startTime: '09:00',
                    endTime: '17:00',
                };
            }
        }

        return NextResponse.json({ availability: availabilityMap });
    } catch (error) {
        console.error('[Availability] GET Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const availabilityData = updateAvailabilitySchema.parse(body.availability);

        // Use a transaction to update all availability slots
        await prisma.$transaction(async (tx) => {
            // Delete existing availability
            await tx.cleanerAvailability.deleteMany({
                where: { cleanerId: cleaner.id }
            });

            // Create new availability slots
            await tx.cleanerAvailability.createMany({
                data: availabilityData.map(slot => ({
                    cleanerId: cleaner.id,
                    dayOfWeek: slot.dayOfWeek as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY',
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    isActive: slot.isActive,
                }))
            });
        });

        return NextResponse.json({ success: true, message: 'Availability updated' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('[Availability] PUT Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
