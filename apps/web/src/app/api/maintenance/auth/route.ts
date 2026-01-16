/**
 * Maintenance Auth API
 * 
 * Validates maintenance password and sets bypass cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        // Get maintenance password from SystemConfig
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'maintenance_password' }
        });

        const correctPassword = config?.value || 'fixelo2026';

        if (password !== correctPassword) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Set bypass cookie (24 hours)
        const cookieStore = await cookies();
        cookieStore.set('maintenance_bypass', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[MaintenanceAuth] Error:', error);
        return NextResponse.json({
            error: 'Failed to verify password'
        }, { status: 500 });
    }
}

// GET - Check if maintenance is active
export async function GET() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'maintenance_mode' }
        });

        return NextResponse.json({
            maintenanceMode: config?.value === 'true',
            message: config?.value === 'true'
                ? 'Site is in maintenance mode'
                : 'Site is operating normally'
        });

    } catch (error) {
        console.error('[MaintenanceAuth] GET Error:', error);
        return NextResponse.json({ maintenanceMode: false }, { status: 200 });
    }
}
