import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

const CONFIG_KEYS = [
    'business_hours_start',
    'business_hours_end',
    'operating_days',
    'timezone',
    'booking_lead_time_hours',
    'service_radius_km',
];

const DEFAULTS: Record<string, string> = {
    business_hours_start: '08:00',
    business_hours_end: '20:00',
    operating_days: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
    timezone: 'America/New_York',
    booking_lead_time_hours: '24',
    service_radius_km: '50',
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.systemConfig.findMany({
            where: { key: { in: CONFIG_KEYS } }
        });

        const configMap = new Map(configs.map(c => [c.key, c.value]));

        return NextResponse.json({
            businessHoursStart: configMap.get('business_hours_start') ?? DEFAULTS.business_hours_start,
            businessHoursEnd: configMap.get('business_hours_end') ?? DEFAULTS.business_hours_end,
            operatingDays: JSON.parse(configMap.get('operating_days') ?? DEFAULTS.operating_days),
            timezone: configMap.get('timezone') ?? DEFAULTS.timezone,
            bookingLeadTimeHours: parseInt(configMap.get('booking_lead_time_hours') ?? DEFAULTS.booking_lead_time_hours),
            serviceRadiusKm: parseInt(configMap.get('service_radius_km') ?? DEFAULTS.service_radius_km),
        });
    } catch (error) {
        console.error('GET scheduling settings error:', error);
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
        const userId = (session.user as any).id;

        // Map body to config keys
        const updates = [
            { key: 'business_hours_start', value: body.businessHoursStart },
            { key: 'business_hours_end', value: body.businessHoursEnd },
            { key: 'operating_days', value: JSON.stringify(body.operatingDays) },
            { key: 'timezone', value: body.timezone },
            { key: 'booking_lead_time_hours', value: body.bookingLeadTimeHours.toString() },
            { key: 'service_radius_km', value: body.serviceRadiusKm.toString() },
        ];

        for (const { key, value } of updates) {
            await prisma.systemConfig.upsert({
                where: { key },
                create: { key, value, updatedBy: userId },
                update: { value, updatedBy: userId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST scheduling settings error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
