/**
 * Admin Users API - GET/PUT/DELETE
 * Manage individual user by ID
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.enum(['CUSTOMER', 'CLEANER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
});

// GET - Fetch user by ID
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                cleanerProfile: true,
                addresses: true,
                _count: {
                    select: {
                        bookings: true,
                        reviews: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('[Users API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT - Update user
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.errors
            }, { status: 400 });
        }

        const data = validation.data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id }
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent self-demotion from admin
        if (params.id === session.user.id && data.role && data.role !== 'ADMIN') {
            return NextResponse.json({
                error: 'Cannot change your own admin role'
            }, { status: 400 });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: params.id },
            data: {
                ...(data.firstName && { firstName: data.firstName }),
                ...(data.lastName && { lastName: data.lastName }),
                ...(data.email && { email: data.email }),
                ...(data.phone && { phone: data.phone }),
                ...(data.role && { role: data.role as UserRole }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            }
        });

        return NextResponse.json({
            success: true,
            user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('[Users API] PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE - Delete user (soft delete by default)
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Prevent self-deletion
        if (params.id === session.user.id) {
            return NextResponse.json({
                error: 'Cannot delete your own account'
            }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
            include: { _count: { select: { bookings: true } } }
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for hard delete query param
        const url = new URL(req.url);
        const hardDelete = url.searchParams.get('hard') === 'true';

        if (hardDelete) {
            // Hard delete - only if no bookings
            if (existingUser._count.bookings > 0) {
                return NextResponse.json({
                    error: 'Cannot permanently delete user with bookings. Use soft delete instead.'
                }, { status: 400 });
            }

            await prisma.user.delete({ where: { id: params.id } });
            return NextResponse.json({
                success: true,
                message: 'User permanently deleted'
            });
        } else {
            // Soft delete - deactivate user
            await prisma.user.update({
                where: { id: params.id },
                data: { isActive: false }
            });
            return NextResponse.json({
                success: true,
                message: 'User deactivated successfully'
            });
        }
    } catch (error) {
        console.error('[Users API] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
