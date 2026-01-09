import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

const CONFIG_KEYS = [
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_password',
    'smtp_from_name',
    'smtp_from_email',
    'email_enabled',
];

const DEFAULTS: Record<string, string> = {
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_name: 'Fixelo',
    smtp_from_email: 'no-reply@fixelo.app',
    email_enabled: 'true',
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
            smtpHost: configMap.get('smtp_host') ?? DEFAULTS.smtp_host,
            smtpPort: parseInt(configMap.get('smtp_port') ?? DEFAULTS.smtp_port),
            smtpUser: configMap.get('smtp_user') ?? DEFAULTS.smtp_user,
            smtpPassword: configMap.get('smtp_password') ? '********' : '', // Masked for security
            fromName: configMap.get('smtp_from_name') ?? DEFAULTS.smtp_from_name,
            fromEmail: configMap.get('smtp_from_email') ?? DEFAULTS.smtp_from_email,
            isEnabled: (configMap.get('email_enabled') ?? DEFAULTS.email_enabled) === 'true',
        });
    } catch (error) {
        console.error('GET email settings error:', error);
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

        // Only update password if it's not the masked placeholder
        const updates = [
            { key: 'smtp_host', value: body.smtpHost },
            { key: 'smtp_port', value: body.smtpPort.toString() },
            { key: 'smtp_user', value: body.smtpUser },
            { key: 'smtp_from_name', value: body.fromName },
            { key: 'smtp_from_email', value: body.fromEmail },
            { key: 'email_enabled', value: body.isEnabled.toString() },
        ];

        // Only update password if changed (not masked)
        if (body.smtpPassword && body.smtpPassword !== '********') {
            updates.push({ key: 'smtp_password', value: body.smtpPassword });
        }

        for (const { key, value } of updates) {
            await prisma.systemConfig.upsert({
                where: { key },
                create: { key, value, updatedBy: userId },
                update: { value, updatedBy: userId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST email settings error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
