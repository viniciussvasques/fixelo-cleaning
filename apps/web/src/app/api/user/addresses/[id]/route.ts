import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const addressUpdateSchema = z.object({
    street: z.string().min(1).optional(),
    unit: z.string().optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(2).max(2).optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    accessInstructions: z.string().optional(),
    isDefault: z.boolean().optional(),
});

// PATCH - Update address
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify address belongs to user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = addressUpdateSchema.parse(body);

        // If setting as default, unset others
        if (validatedData.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id },
                data: { isDefault: false }
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: params.id },
            data: validatedData
        });

        return NextResponse.json(updatedAddress);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Address update error:', error);
        return NextResponse.json(
            { error: 'Failed to update address' },
            { status: 500 }
        );
    }
}

// DELETE - Delete address
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify address belongs to user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        await prisma.address.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Address deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete address' },
            { status: 500 }
        );
    }
}
