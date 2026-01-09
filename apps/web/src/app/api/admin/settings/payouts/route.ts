import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get or create financial settings
        let settings = await prisma.financialSettings.findFirst();

        if (!settings) {
            settings = await prisma.financialSettings.create({
                data: {} // Uses defaults from schema
            });
        }

        return NextResponse.json({
            autoPayoutEnabled: settings.autoPayoutEnabled,
            payoutSchedule: settings.payoutSchedule,
            payoutDay: settings.payoutDay,
            minPayoutAmount: settings.minPayoutAmount,
            holdDaysAfterService: settings.holdDaysAfterService,
            requireCustomerReview: settings.requireCustomerReview,
        });
    } catch (error) {
        console.error('GET payout settings error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validate
        if (body.minPayoutAmount < 0 || body.holdDaysAfterService < 0) {
            return NextResponse.json({ message: 'Invalid values' }, { status: 400 });
        }

        // Get existing settings or create
        let settings = await prisma.financialSettings.findFirst();

        if (settings) {
            settings = await prisma.financialSettings.update({
                where: { id: settings.id },
                data: {
                    autoPayoutEnabled: body.autoPayoutEnabled,
                    payoutSchedule: body.payoutSchedule,
                    payoutDay: body.payoutDay,
                    minPayoutAmount: body.minPayoutAmount,
                    holdDaysAfterService: body.holdDaysAfterService,
                    requireCustomerReview: body.requireCustomerReview,
                }
            });
        } else {
            settings = await prisma.financialSettings.create({
                data: {
                    autoPayoutEnabled: body.autoPayoutEnabled,
                    payoutSchedule: body.payoutSchedule,
                    payoutDay: body.payoutDay,
                    minPayoutAmount: body.minPayoutAmount,
                    holdDaysAfterService: body.holdDaysAfterService,
                    requireCustomerReview: body.requireCustomerReview,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST payout settings error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
