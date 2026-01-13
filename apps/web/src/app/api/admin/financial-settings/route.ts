import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

// Default settings if none exist
const defaultSettings = {
    platformFeePercent: 15,
    insuranceFeePercent: 2,
    autoPayoutEnabled: true,
    payoutSchedule: 'WEEKLY',
    payoutDay: 'Friday',
    minPayoutAmount: 50,
    holdDaysAfterService: 2,
    requireCustomerReview: true,
    stripeFeePercent: 2.9,
    stripeFeeFixed: 0.30,
    // Booking settings
    minBookingAmount: 60,
    // Recurring discounts
    weeklyDiscount: 15,
    biweeklyDiscount: 10,
    monthlyDiscount: 5,
    // Cancellation settings
    freeCancelHours: 24,
    lateCancelFeePercent: 50,
    cleanerStrikePenalty: 25,
    maxStrikes: 3,
    // Quality settings
    autoRefundThreshold: 2,
    recleanWindowHours: 48,
    // Job execution settings
    requiredBeforePhotos: 3,
    requiredAfterPhotos: 3,
    geofenceRadiusMeters: 100,
};

import { UserRole } from '@prisma/client';

export async function GET() {
    try {
        const session = await auth();
        // Check for Admin role (assuming we have role checking utility or manual check)
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.financialSettings.findFirst();

        if (!settings) {
            // Return defaults if not set
            return NextResponse.json(defaultSettings);
        }

        return NextResponse.json(settings);
    } catch (_error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Find existing or create new
        const existing = await prisma.financialSettings.findFirst();

        const dataToSave = {
            platformFeePercent: body.platformFeePercent !== undefined ? parseFloat(body.platformFeePercent) / 100 : undefined,
            insuranceFeePercent: body.insuranceFeePercent !== undefined ? parseFloat(body.insuranceFeePercent) / 100 : undefined,
            autoPayoutEnabled: body.autoPayoutEnabled,
            payoutSchedule: body.payoutSchedule,
            payoutDay: body.payoutDay,
            minPayoutAmount: body.minPayoutAmount !== undefined ? parseFloat(body.minPayoutAmount) : undefined,
            holdDaysAfterService: body.holdDaysAfterService !== undefined ? parseInt(body.holdDaysAfterService) : undefined,
            requireCustomerReview: body.requireCustomerReview,
            // Booking
            minBookingAmount: body.minBookingAmount !== undefined ? parseFloat(body.minBookingAmount) : undefined,
            // Recurring discounts (stored as decimals)
            weeklyDiscount: body.weeklyDiscount !== undefined ? parseFloat(body.weeklyDiscount) / 100 : undefined,
            biweeklyDiscount: body.biweeklyDiscount !== undefined ? parseFloat(body.biweeklyDiscount) / 100 : undefined,
            monthlyDiscount: body.monthlyDiscount !== undefined ? parseFloat(body.monthlyDiscount) / 100 : undefined,
            // Cancellation
            freeCancelHours: body.freeCancelHours !== undefined ? parseInt(body.freeCancelHours) : undefined,
            lateCancelFeePercent: body.lateCancelFeePercent !== undefined ? parseFloat(body.lateCancelFeePercent) / 100 : undefined,
            cleanerStrikePenalty: body.cleanerStrikePenalty !== undefined ? parseFloat(body.cleanerStrikePenalty) : undefined,
            maxStrikes: body.maxStrikes !== undefined ? parseInt(body.maxStrikes) : undefined,
            // Quality
            autoRefundThreshold: body.autoRefundThreshold !== undefined ? parseInt(body.autoRefundThreshold) : undefined,
            recleanWindowHours: body.recleanWindowHours !== undefined ? parseInt(body.recleanWindowHours) : undefined,
            // Job execution
            requiredBeforePhotos: body.requiredBeforePhotos !== undefined ? parseInt(body.requiredBeforePhotos) : undefined,
            requiredAfterPhotos: body.requiredAfterPhotos !== undefined ? parseInt(body.requiredAfterPhotos) : undefined,
            geofenceRadiusMeters: body.geofenceRadiusMeters !== undefined ? parseInt(body.geofenceRadiusMeters) : undefined,
        };

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(dataToSave).filter(([_, v]) => v !== undefined)
        );

        if (existing) {
            const updatedSettings = await prisma.financialSettings.update({
                where: { id: existing.id },
                data: cleanData
            });
            return NextResponse.json(updatedSettings);
        } else {
            const newSettings = await prisma.financialSettings.create({
                data: cleanData as any
            });
            return NextResponse.json(newSettings);
        }

    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
