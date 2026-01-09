import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    unit: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required').max(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().default('US'),
    accessInstructions: z.string().optional(),
    isDefault: z.boolean().default(false),
});

// GET - List all addresses
export async function GET(_request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: { isDefault: 'desc' }
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error('Address fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch addresses' },
            { status: 500 }
        );
    }
}

// POST - Create new address
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = addressSchema.parse(body);

        // If this is set as default, unset other defaults
        if (validatedData.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.create({
            data: {
                ...validatedData,
                userId: session.user.id,
            }
        });

        return NextResponse.json(address, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Address creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create address' },
            { status: 500 }
        );
    }
}
