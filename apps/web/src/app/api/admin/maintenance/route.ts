/**
 * Maintenance Toggle API (Admin Only)
 * 
 * Enables/disables maintenance mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get maintenance settings
        const [modeConfig, passwordConfig, stripeConfig] = await Promise.all([
            prisma.systemConfig.findUnique({ where: { key: 'maintenance_mode' } }),
            prisma.systemConfig.findUnique({ where: { key: 'maintenance_password' } }),
            prisma.systemConfig.findUnique({ where: { key: 'stripe_mode' } })
        ]);

        return NextResponse.json({
            maintenanceMode: modeConfig?.value === 'true',
            maintenancePassword: passwordConfig?.value || 'fixelo2026',
            stripeMode: stripeConfig?.value || 'production'
        });

    } catch (error) {
        console.error('[MaintenanceToggle] GET Error:', error);
        return NextResponse.json({ error: 'Failed to get maintenance settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, maintenancePassword, stripeMode } = await request.json();

        if (action === 'enable') {
            await prisma.systemConfig.upsert({
                where: { key: 'maintenance_mode' },
                update: { value: 'true' },
                create: { key: 'maintenance_mode', value: 'true', description: 'Maintenance mode enabled' }
            });

            return NextResponse.json({
                success: true,
                maintenanceMode: true,
                message: 'Maintenance mode enabled. Set MAINTENANCE_MODE=true in environment to activate.'
            });

        } else if (action === 'disable') {
            await prisma.systemConfig.upsert({
                where: { key: 'maintenance_mode' },
                update: { value: 'false' },
                create: { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode disabled' }
            });

            return NextResponse.json({
                success: true,
                maintenanceMode: false,
                message: 'Maintenance mode disabled. Remove MAINTENANCE_MODE from environment.'
            });

        } else if (action === 'update_password') {
            if (!maintenancePassword) {
                return NextResponse.json({ error: 'Password required' }, { status: 400 });
            }

            await prisma.systemConfig.upsert({
                where: { key: 'maintenance_password' },
                update: { value: maintenancePassword },
                create: { key: 'maintenance_password', value: maintenancePassword, description: 'Maintenance bypass password' }
            });

            return NextResponse.json({ success: true, message: 'Password updated' });

        } else if (action === 'set_stripe_mode') {
            if (!stripeMode || !['test', 'production'].includes(stripeMode)) {
                return NextResponse.json({ error: 'Invalid stripe mode' }, { status: 400 });
            }

            await prisma.systemConfig.upsert({
                where: { key: 'stripe_mode' },
                update: { value: stripeMode },
                create: { key: 'stripe_mode', value: stripeMode, description: 'Stripe API mode (test/production)' }
            });

            return NextResponse.json({
                success: true,
                stripeMode,
                message: `Stripe mode set to ${stripeMode}. Restart required for changes to take effect.`
            });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('[MaintenanceToggle] POST Error:', error);
        return NextResponse.json({ error: 'Failed to update maintenance settings' }, { status: 500 });
    }
}
