import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

const CONFIG_KEYS = [
    'company_name',
    'support_email',
    'support_phone',
    'company_address',
    'website_url',
    'terms_url',
    'privacy_url',
    'linkedin_url',
    'instagram_url',
    'facebook_url',
];

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
            companyName: configMap.get('company_name') ?? 'Fixelo',
            supportEmail: configMap.get('support_email') ?? '',
            supportPhone: configMap.get('support_phone') ?? '',
            address: configMap.get('company_address') ?? '',
            websiteUrl: configMap.get('website_url') ?? '',
            termsUrl: configMap.get('terms_url') ?? '',
            privacyUrl: configMap.get('privacy_url') ?? '',
            linkedinUrl: configMap.get('linkedin_url') ?? '',
            instagramUrl: configMap.get('instagram_url') ?? '',
            facebookUrl: configMap.get('facebook_url') ?? '',
        });
    } catch (error) {
        console.error('GET company settings error:', error);
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

        const updates = [
            { key: 'company_name', value: body.companyName },
            { key: 'support_email', value: body.supportEmail },
            { key: 'support_phone', value: body.supportPhone },
            { key: 'company_address', value: body.address },
            { key: 'website_url', value: body.websiteUrl },
            { key: 'terms_url', value: body.termsUrl },
            { key: 'privacy_url', value: body.privacyUrl },
            { key: 'linkedin_url', value: body.linkedinUrl },
            { key: 'instagram_url', value: body.instagramUrl },
            { key: 'facebook_url', value: body.facebookUrl },
        ];

        for (const { key, value } of updates) {
            await prisma.systemConfig.upsert({
                where: { key },
                create: { key, value: value || '', updatedBy: userId },
                update: { value: value || '', updatedBy: userId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST company settings error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
