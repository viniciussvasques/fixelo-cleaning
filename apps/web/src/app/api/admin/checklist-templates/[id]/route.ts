/**
 * Checklist Template Detail API (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const updateTemplateSchema = z.object({
    name: z.string().min(1),
    serviceTypeId: z.string().uuid().optional().nullable(),
    isDefault: z.boolean().default(false),
    items: z.array(z.object({
        category: z.string().min(1),
        task: z.string().min(1),
        isRequired: z.boolean().default(true),
        sortOrder: z.number().default(0),
    })),
});

/**
 * GET - Get single template
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const template = await prisma.checklistTemplate.findUnique({
            where: { id },
            include: {
                items: { orderBy: { sortOrder: 'asc' } },
                serviceType: { select: { id: true, name: true } },
            }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);

    } catch (error) {
        console.error('[ChecklistTemplate] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

/**
 * PUT - Update template
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateTemplateSchema.parse(body);

        // If setting as default, unset other defaults
        if (validatedData.isDefault) {
            await prisma.checklistTemplate.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        // Update template and recreate items
        const template = await prisma.$transaction(async (tx) => {
            // Delete existing items
            await tx.checklistTemplateItem.deleteMany({
                where: { templateId: id }
            });

            // Update template and create new items
            return await tx.checklistTemplate.update({
                where: { id },
                data: {
                    name: validatedData.name,
                    serviceTypeId: validatedData.serviceTypeId,
                    isDefault: validatedData.isDefault,
                    items: {
                        create: validatedData.items.map((item, index) => ({
                            ...item,
                            sortOrder: item.sortOrder || index
                        }))
                    }
                },
                include: { items: true }
            });
        });

        return NextResponse.json({
            success: true,
            template
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[ChecklistTemplate] PUT error:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

/**
 * DELETE - Delete template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if it's the default template
        const template = await prisma.checklistTemplate.findUnique({
            where: { id },
            select: { isDefault: true }
        });

        if (template?.isDefault) {
            return NextResponse.json({ 
                error: 'Cannot delete the default template' 
            }, { status: 400 });
        }

        await prisma.checklistTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[ChecklistTemplate] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
