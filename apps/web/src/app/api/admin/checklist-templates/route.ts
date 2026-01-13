/**
 * Checklist Templates API (Admin only)
 * 
 * Manage cleaning checklist templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const checklistItemSchema = z.object({
    category: z.string().min(1),
    task: z.string().min(1),
    isRequired: z.boolean().default(true),
    sortOrder: z.number().default(0),
});

const createTemplateSchema = z.object({
    name: z.string().min(1),
    serviceTypeId: z.string().uuid().optional(),
    isDefault: z.boolean().default(false),
    items: z.array(checklistItemSchema),
});

/**
 * GET - List all templates
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templates = await prisma.checklistTemplate.findMany({
            include: {
                items: {
                    orderBy: { sortOrder: 'asc' }
                },
                serviceType: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(templates);

    } catch (error) {
        console.error('[ChecklistTemplates] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

/**
 * POST - Create new template
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createTemplateSchema.parse(body);

        // If setting as default, unset other defaults
        if (validatedData.isDefault) {
            await prisma.checklistTemplate.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.checklistTemplate.create({
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
            include: {
                items: true
            }
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
        console.error('[ChecklistTemplates] POST error:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
