/**
 * Admin Support Ticket Detail API
 * 
 * View and respond to individual tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole } from '@prisma/client';
import { sendEmailNotification } from '@/lib/email';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET - Get ticket details with messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        phone: true,
                    }
                },
                booking: {
                    select: {
                        id: true,
                        scheduledDate: true,
                        status: true,
                        totalPrice: true,
                        serviceType: { select: { name: true } },
                    }
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                attachments: true,
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json(ticket);

    } catch (error) {
        console.error('[AdminSupportTicket] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }
}

/**
 * POST - Reply to ticket
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { content, newStatus, isInternal } = await request.json();

        if (!content || content.trim().length < 2) {
            return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Create message
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: session.user.id,
                content: content.trim(),
                isInternal: isInternal || false,
            }
        });

        // Update ticket status if provided
        if (newStatus) {
            await prisma.supportTicket.update({
                where: { id },
                data: {
                    status: newStatus,
                    ...(newStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
                    assignedTo: session.user.id,
                }
            });
        }

        // Send email notification to user (if not internal)
        if (!isInternal && ticket.user.email) {
            try {
                await sendEmailNotification(ticket.user.id, {
                    to: ticket.user.email,
                    subject: `Update on your support ticket: ${ticket.subject}`,
                    html: `
                        <h2>Support Ticket Update</h2>
                        <p>Hi ${ticket.user.firstName || 'there'},</p>
                        <p>We've responded to your support ticket:</p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 0;">${content}</p>
                        </div>
                        ${newStatus === 'RESOLVED' ? '<p><strong>This ticket has been marked as resolved.</strong> If you need further assistance, please reply.</p>' : ''}
                        <p>Best regards,<br/>Fixelo Support Team</p>
                    `,
                }, { ticketId: id, type: 'TICKET_REPLY' });
            } catch (emailError) {
                console.error('[AdminSupportTicket] Failed to send email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message,
            newStatus
        });

    } catch (error) {
        console.error('[AdminSupportTicket] POST error:', error);
        return NextResponse.json({ error: 'Failed to reply to ticket' }, { status: 500 });
    }
}

/**
 * PATCH - Update ticket (status, priority, assignment)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {};
        if (body.status) updateData.status = body.status;
        if (body.priority) updateData.priority = body.priority;
        if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
        if (body.status === 'RESOLVED') updateData.resolvedAt = new Date();

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            ticket
        });

    } catch (error) {
        console.error('[AdminSupportTicket] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}
