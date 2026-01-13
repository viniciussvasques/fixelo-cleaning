/**
 * Recurring Bookings API
 * 
 * Allows customers to set up recurring cleaning services with discounts:
 * - Weekly: 15% off
 * - Bi-weekly: 10% off
 * - Monthly: 5% off
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const recurringSchema = z.object({
    serviceTypeId: z.string().uuid(),
    addressId: z.string().uuid(),
    bedrooms: z.number().min(1).max(10),
    bathrooms: z.number().min(1).max(10),
    hasPets: z.boolean().optional(),
    specialInstructions: z.string().optional(),
    preferredDay: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    preferredTime: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
    frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    preferredCleanerId: z.string().uuid().optional(),
});

// Get discount based on frequency
async function getDiscountForFrequency(frequency: string): Promise<number> {
    const settings = await prisma.financialSettings.findFirst();
    
    switch (frequency) {
        case 'WEEKLY':
            return settings?.weeklyDiscount ?? 0.15;
        case 'BIWEEKLY':
            return settings?.biweeklyDiscount ?? 0.10;
        case 'MONTHLY':
            return settings?.monthlyDiscount ?? 0.05;
        default:
            return 0;
    }
}

// Calculate next booking date based on frequency and preferred day
function calculateNextBookingDate(preferredDay: string, frequency: string): Date {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const targetDayIndex = days.indexOf(preferredDay);
    
    const now = new Date();
    const currentDayIndex = now.getDay();
    
    // Find next occurrence of preferred day
    let daysUntilNext = targetDayIndex - currentDayIndex;
    if (daysUntilNext <= 0) {
        daysUntilNext += 7;
    }
    
    // Add at least 2 days for processing
    if (daysUntilNext < 2) {
        daysUntilNext += 7;
    }
    
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilNext);
    nextDate.setHours(9, 0, 0, 0); // Default to 9 AM
    
    return nextDate;
}

// Create a new recurring booking
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const data = recurringSchema.parse(body);

        // Verify address belongs to user
        const address = await prisma.address.findFirst({
            where: { id: data.addressId, userId: session.user.id }
        });

        if (!address) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        // Get discount for this frequency
        const discountPercent = await getDiscountForFrequency(data.frequency);

        // Calculate next booking date
        const nextBookingDate = calculateNextBookingDate(data.preferredDay, data.frequency);

        // Create recurring booking
        const recurring = await prisma.recurringBooking.create({
            data: {
                userId: session.user.id,
                serviceTypeId: data.serviceTypeId,
                addressId: data.addressId,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                hasPets: data.hasPets || false,
                specialInstructions: data.specialInstructions,
                preferredDay: data.preferredDay as any,
                preferredTime: data.preferredTime,
                frequency: data.frequency as any,
                discountPercent,
                nextBookingDate,
                preferredCleanerId: data.preferredCleanerId,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            recurring,
            discountPercent: discountPercent * 100, // Return as percentage
            nextBookingDate,
            message: `Recurring ${data.frequency.toLowerCase()} cleaning set up! You'll save ${(discountPercent * 100).toFixed(0)}% on each booking.`
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        console.error('Recurring booking error:', error);
        return NextResponse.json({ error: 'Failed to create recurring booking' }, { status: 500 });
    }
}

// Get user's recurring bookings
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const recurring = await prisma.recurringBooking.findMany({
            where: { userId: session.user.id },
            include: {
                bookings: {
                    take: 5,
                    orderBy: { scheduledDate: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(recurring);

    } catch (error) {
        console.error('Get recurring error:', error);
        return NextResponse.json({ error: 'Failed to get recurring bookings' }, { status: 500 });
    }
}
