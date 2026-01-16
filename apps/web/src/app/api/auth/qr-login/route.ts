/**
 * QR Login API
 * 
 * Authenticates user using QR session token
 * Creates a session and returns credentials for auto-login
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        // Get token data
        const key = `qr_session_${token}`;
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });

        if (!config) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const data = JSON.parse(config.value);
        const expiresAt = new Date(data.expiresAt);

        // Check expiration
        if (new Date() > expiresAt) {
            await prisma.systemConfig.delete({ where: { key } });
            return NextResponse.json({ error: 'Token expired' }, { status: 410 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                emailVerified: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create JWT token for next-auth
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET not configured');
        }

        // Generate salt for the JWT
        const salt = 'authjs.session-token';

        const jwtToken = await encode({
            token: {
                sub: user.id,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: user.role,
                emailVerified: user.emailVerified,
            },
            secret,
            salt,
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        // Set the session cookie
        const cookieStore = await cookies();
        const isProduction = process.env.NODE_ENV === 'production';

        cookieStore.set('next-auth.session-token', jwtToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        // Also set the callback-url cookie if needed
        if (isProduction) {
            cookieStore.set('__Secure-next-auth.session-token', jwtToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 30 * 24 * 60 * 60,
            });
        }

        // Delete the QR token (one-time use)
        await prisma.systemConfig.delete({ where: { key } });

        console.log(`[QRLogin] User ${user.email} logged in via QR code`);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: user.role,
            }
        });

    } catch (error) {
        console.error('[QRLogin] Error:', error);
        return NextResponse.json({
            error: 'Login failed'
        }, { status: 500 });
    }
}
