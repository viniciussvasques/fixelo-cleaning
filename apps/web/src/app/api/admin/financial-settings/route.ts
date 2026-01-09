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
    stripeFeePercent: 2.9, // Read-only usually
    stripeFeeFixed: 0.30,  // Read-only usually
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

        if (existing) {
            const updatedSettings = await prisma.financialSettings.update({
                where: { id: existing.id },
                data: {
                    platformFeePercent: parseFloat(body.platformFeePercent),
                    insuranceFeePercent: parseFloat(body.insuranceFeePercent),
                    autoPayoutEnabled: body.autoPayoutEnabled,
                    payoutSchedule: body.payoutSchedule,
                    payoutDay: body.payoutDay,
                    minPayoutAmount: parseFloat(body.minPayoutAmount),
                    holdDaysAfterService: parseInt(body.holdDaysAfterService),
                    requireCustomerReview: body.requireCustomerReview
                }
            });
            return NextResponse.json(updatedSettings);
        } else {
            const newSettings = await prisma.financialSettings.create({
                data: {
                    platformFeePercent: parseFloat(body.platformFeePercent),
                    insuranceFeePercent: parseFloat(body.insuranceFeePercent),
                    autoPayoutEnabled: body.autoPayoutEnabled,
                    payoutSchedule: body.payoutSchedule,
                    payoutDay: body.payoutDay,
                    minPayoutAmount: parseFloat(body.minPayoutAmount),
                    holdDaysAfterService: parseInt(body.holdDaysAfterService),
                    requireCustomerReview: body.requireCustomerReview
                }
            });
            return NextResponse.json(newSettings);
        }

    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
