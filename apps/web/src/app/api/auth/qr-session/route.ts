/**
 * QR Code Session API
 * 
 * Generates a temporary session token for mobile login
 * Used when cleaners start onboarding on desktop and want to continue on mobile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { randomBytes } from 'crypto';

// Token expiration time (15 minutes)
const TOKEN_EXPIRY_MINUTES = 15;

// POST - Generate a new QR session token
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate a unique token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Store token in SystemConfig as a JSON string (temporary storage)
        // In production, you'd use Redis or a dedicated table
        const key = `qr_session_${token}`;

        await prisma.systemConfig.upsert({
            where: { key },
            update: {
                value: JSON.stringify({
                    userId: session.user.id,
                    email: session.user.email,
                    role: session.user.role,
                    expiresAt: expiresAt.toISOString()
                }),
                updatedAt: new Date()
            },
            create: {
                key,
                value: JSON.stringify({
                    userId: session.user.id,
                    email: session.user.email,
                    role: session.user.role,
                    expiresAt: expiresAt.toISOString()
                }),
                description: 'QR Session Token'
            }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app';
        const qrUrl = `${appUrl}/auth/qr-login?token=${token}`;

        return NextResponse.json({
            token,
            qrUrl,
            expiresAt: expiresAt.toISOString(),
            expiresInMinutes: TOKEN_EXPIRY_MINUTES
        });

    } catch (error) {
        console.error('[QRSession] Generate Error:', error);
        return NextResponse.json({
            error: 'Failed to generate QR session'
        }, { status: 500 });
    }
}

// GET - Validate token and return session info
export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const key = `qr_session_${token}`;
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });

        if (!config) {
            return NextResponse.json({
                valid: false,
                error: 'Invalid or expired token'
            }, { status: 404 });
        }

        const data = JSON.parse(config.value);
        const expiresAt = new Date(data.expiresAt);

        if (new Date() > expiresAt) {
            // Clean up expired token
            await prisma.systemConfig.delete({ where: { key } });
            return NextResponse.json({
                valid: false,
                error: 'Token expired'
            }, { status: 410 });
        }

        return NextResponse.json({
            valid: true,
            userId: data.userId,
            email: data.email,
            role: data.role,
            expiresAt: data.expiresAt
        });

    } catch (error) {
        console.error('[QRSession] Validate Error:', error);
        return NextResponse.json({
            valid: false,
            error: 'Failed to validate token'
        }, { status: 500 });
    }
}

// DELETE - Consume/invalidate token after successful login
export async function DELETE(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const key = `qr_session_${token}`;
        await prisma.systemConfig.deleteMany({
            where: { key }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[QRSession] Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
    }
}
