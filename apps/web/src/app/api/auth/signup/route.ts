import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@fixelo/database';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

const signupSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().nullable().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    referralCode: z.string().optional(),
    role: z.enum(['CUSTOMER', 'CLEANER']).default('CUSTOMER'),
});

export async function POST(request: Request) {
    // Rate limiting
    const clientIp = getClientIp(request);
    const { success, resetIn } = checkRateLimit(`signup:${clientIp}`, RATE_LIMIT_PRESETS.auth);
    if (!success) {
        return rateLimitResponse(resetIn);
    }

    try {
        const body = await request.json();

        // Validate input
        const validatedData = signupSchema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Check availability of phone number if provided
        if (validatedData.phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone: validatedData.phone },
            });
            if (existingPhone) {
                return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 });
            }
        }

        // Hash password
        const passwordHash = await hash(validatedData.password, 12);

        // Create Unique Referral Code for New User
        // Simple logic: First 3 letters of First Name + Random 4 digits
        // In production, we should check for collisions.
        const baseCode = validatedData.firstName.substring(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const newReferralCode = `${baseCode}${rand}`;

        // Handle Incoming Referral
        let initialCredits = 0;
        let referrerId: string | null = null;

        if (validatedData.referralCode) {
            const referrer = await prisma.user.findUnique({
                where: { referralCode: validatedData.referralCode },
            });
            if (referrer) {
                referrerId = referrer.id;
                initialCredits = 20; // Give $20
            }
        }

        // Create user with transaction to handle referral relation
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                phone: validatedData.phone || null,
                role: validatedData.role || 'CUSTOMER',
                referralCode: newReferralCode,
                credits: initialCredits,
                // Create Referral Record if referrer exists
                ...(referrerId && {
                    referralReceived: {
                        create: {
                            referrerId: referrerId,
                            status: 'PENDING', // Pending until first job completed for Referrer bonus
                            bonusAmount: 20
                        }
                    }
                })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                credits: true,
                referralCode: true,
            },
        });

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signup. Please try again.' },
            { status: 500 }
        );
    }
}
