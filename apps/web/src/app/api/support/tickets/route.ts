/**
 * Support Tickets API
 * 
 * Create and list support tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { z } from 'zod';
import { sendEmailNotification } from '@/lib/email';

const createTicketSchema = z.object({
    category: z.nativeEnum(TicketCategory),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    bookingId: z.string().uuid().optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
});

/**
 * Generate unique ticket number
 */
async function generateTicketNumber(): Promise<string> {
    const count = await prisma.supportTicket.count();
    const number = (count + 1).toString().padStart(7, '0');
    return `TKT-${number}`;
}

/**
 * GET - List user's tickets
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const where: any = { userId: session.user.id };
        if (status) {
            where.status = status as TicketStatus;
        }

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.supportTicket.count({ where })
        ]);

        return NextResponse.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[Support] GET error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch tickets' 
        }, { status: 500 });
    }
}

/**
 * POST - Create new support ticket
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createTicketSchema.parse(body);

        // Get cleaner ID if user is a cleaner
        let cleanerId: string | undefined;
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });
        if (cleaner) {
            cleanerId = cleaner.id;
        }

        // Auto-set priority for certain categories
        let priority = validatedData.priority || TicketPriority.MEDIUM;
        if (validatedData.category === TicketCategory.PAYMENT_ISSUE) {
            priority = TicketPriority.HIGH;
        }

        const ticketNumber = await generateTicketNumber();

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,
                userId: session.user.id,
                bookingId: validatedData.bookingId,
                cleanerId,
                category: validatedData.category,
                subject: validatedData.subject,
                description: validatedData.description,
                priority,
                status: TicketStatus.OPEN,
                source: 'app'
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Send confirmation email
        if (ticket.user.email) {
            await sendEmailNotification(session.user.id, {
                to: ticket.user.email,
                subject: `Support Ticket Created - ${ticket.ticketNumber}`,
                html: `
                    <h2>We've received your support request</h2>
                    <p>Hi ${ticket.user.firstName},</p>
                    <p>Thank you for contacting Fixelo support. We've received your request and will get back to you shortly.</p>
                    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                        <p><strong>Subject:</strong> ${ticket.subject}</p>
                        <p><strong>Category:</strong> ${ticket.category.replace(/_/g, ' ')}</p>
                    </div>
                    <p>You can view your ticket status at any time in the app.</p>
                    <p>Best regards,<br>Fixelo Support Team</p>
                `
            }, { type: 'SUPPORT_TICKET_CREATED' });
        }

        // TODO: Notify admin team via Slack/email

        return NextResponse.json({
            success: true,
            ticket,
            message: `Ticket ${ticketNumber} created successfully`
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[Support] POST error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to create ticket' 
        }, { status: 500 });
    }
}
