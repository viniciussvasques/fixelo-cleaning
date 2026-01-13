/**
 * Cleaner Private Notes API
 * 
 * Allows cleaners to save private notes about clients/addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

const noteSchema = z.object({
    clientId: z.string().uuid().optional(),
    addressId: z.string().uuid().optional(),
    title: z.string().max(100).optional(),
    content: z.string().min(1).max(2000),
    tags: z.array(z.string()).optional(),
    reminderText: z.string().max(200).optional(),
    showOnNextJob: z.boolean().default(false),
});

const updateNoteSchema = z.object({
    title: z.string().max(100).optional(),
    content: z.string().min(1).max(2000).optional(),
    tags: z.array(z.string()).optional(),
    reminderText: z.string().max(200).optional().nullable(),
    showOnNextJob: z.boolean().optional(),
});

/**
 * GET - List notes (optionally filter by client/address)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const addressId = searchParams.get('addressId');

        const where: any = { cleanerId: cleaner.id };
        if (clientId) where.clientId = clientId;
        if (addressId) where.addressId = addressId;

        const notes = await prisma.cleanerNote.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                address: {
                    select: {
                        id: true,
                        street: true,
                        city: true,
                        label: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(notes);

    } catch (error) {
        console.error('[Notes] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

/**
 * POST - Create new note
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = noteSchema.parse(body);

        if (!validatedData.clientId && !validatedData.addressId) {
            return NextResponse.json({ 
                error: 'Note must be associated with a client or address' 
            }, { status: 400 });
        }

        const note = await prisma.cleanerNote.create({
            data: {
                cleanerId: cleaner.id,
                clientId: validatedData.clientId,
                addressId: validatedData.addressId,
                title: validatedData.title,
                content: validatedData.content,
                tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
                reminderText: validatedData.reminderText,
                showOnNextJob: validatedData.showOnNextJob,
            },
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                address: {
                    select: {
                        street: true,
                        city: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            note,
            message: 'Note saved successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Notes] POST error:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}

/**
 * PATCH - Update existing note
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get('id');

        if (!noteId) {
            return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = updateNoteSchema.parse(body);

        // Verify ownership
        const existing = await prisma.cleanerNote.findFirst({
            where: { id: noteId, cleanerId: cleaner.id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const note = await prisma.cleanerNote.update({
            where: { id: noteId },
            data: {
                title: validatedData.title,
                content: validatedData.content,
                tags: validatedData.tags ? JSON.stringify(validatedData.tags) : existing.tags,
                reminderText: validatedData.reminderText,
                showOnNextJob: validatedData.showOnNextJob,
            }
        });

        return NextResponse.json({
            success: true,
            note,
            message: 'Note updated successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Notes] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}

/**
 * DELETE - Delete note
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get('id');

        if (!noteId) {
            return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
        }

        await prisma.cleanerNote.deleteMany({
            where: { id: noteId, cleanerId: cleaner.id }
        });

        return NextResponse.json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        console.error('[Notes] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}
