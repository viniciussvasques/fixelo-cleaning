/**
 * Individual Support Ticket API
 * 
 * View ticket details and add messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { TicketStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

interface Props {
    params: { id: string };
}

const addMessageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty'),
});

/**
 * GET - Get ticket details with messages
 */
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticketId = params.id;

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                OR: [
                    { id: ticketId },
                    { ticketNumber: ticketId }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                attachments: true
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Only allow owner or admin to view
        if (ticket.userId !== session.user.id && session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        return NextResponse.json(ticket);

    } catch (error) {
        console.error('[Support] GET ticket error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch ticket' 
        }, { status: 500 });
    }
}

/**
 * POST - Add message to ticket
 */
export async function POST(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticketId = params.id;
        const body = await request.json();
        const validatedData = addMessageSchema.parse(body);

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                OR: [
                    { id: ticketId },
                    { ticketNumber: ticketId }
                ]
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Only allow owner or admin to reply
        const isAdmin = session.user.role === UserRole.ADMIN;
        if (ticket.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Add message
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                senderId: session.user.id,
                content: validatedData.content,
                isInternal: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            }
        });

        // Update ticket status based on who replied
        let newStatus = ticket.status;
        if (isAdmin && ticket.status === TicketStatus.OPEN) {
            newStatus = TicketStatus.IN_PROGRESS;
        } else if (isAdmin && ticket.status === TicketStatus.WAITING_CUSTOMER) {
            newStatus = TicketStatus.IN_PROGRESS;
        } else if (!isAdmin && ticket.status === TicketStatus.WAITING_CUSTOMER) {
            newStatus = TicketStatus.IN_PROGRESS;
        }

        if (isAdmin) {
            newStatus = TicketStatus.WAITING_CUSTOMER;
        } else {
            newStatus = TicketStatus.WAITING_CLEANER;
        }

        await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: { 
                status: newStatus,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Support] POST message error:', error);
        return NextResponse.json({ 
            error: 'Failed to add message' 
        }, { status: 500 });
    }
}

/**
 * PATCH - Update ticket status (admin only or close by user)
 */
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticketId = params.id;
        const body = await request.json();
        const { status, resolution } = body;

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                OR: [
                    { id: ticketId },
                    { ticketNumber: ticketId }
                ]
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const isAdmin = session.user.role === UserRole.ADMIN;
        
        // Users can only close their own tickets
        if (!isAdmin && ticket.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Non-admin users can only close tickets
        if (!isAdmin && status && status !== TicketStatus.CLOSED) {
            return NextResponse.json({ error: 'You can only close your ticket' }, { status: 403 });
        }

        const updateData: any = {};
        
        if (status) {
            updateData.status = status;
            if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
                updateData.resolvedAt = new Date();
                if (resolution) {
                    updateData.resolution = resolution;
                }
            }
        }

        const updated = await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            ticket: updated
        });

    } catch (error) {
        console.error('[Support] PATCH error:', error);
        return NextResponse.json({ 
            error: 'Failed to update ticket' 
        }, { status: 500 });
    }
}
