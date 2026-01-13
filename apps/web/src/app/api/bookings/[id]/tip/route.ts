/**
 * Tips API - Allow customers to tip cleaners
 * 100% of tips go directly to the cleaner
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';
import { sendSMSNotification, SMS_TEMPLATES } from '@/lib/sms';
import { sendEmailNotification } from '@/lib/email';

const tipSchema = z.object({
    amount: z.number().min(1).max(500), // $1 to $500 tip limit
});

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount } = tipSchema.parse(body);

        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                user: true,
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: {
                        cleaner: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify ownership
        if (booking.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Verify booking is completed
        if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Can only tip after service completion' }, { status: 400 });
        }

        // Get cleaner
        const assignment = booking.assignments[0];
        if (!assignment?.cleaner) {
            return NextResponse.json({ error: 'No cleaner assigned to this booking' }, { status: 400 });
        }

        const cleaner = assignment.cleaner;

        if (!cleaner.stripeAccountId) {
            return NextResponse.json({ error: 'Cleaner cannot receive tips at this time' }, { status: 400 });
        }

        // Process tip payment via Stripe
        const stripe = await getStripeClient();

        // Create a payment intent for the tip
        const customer = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { stripeCustomerId: true }
        });

        if (!customer?.stripeCustomerId) {
            return NextResponse.json({ error: 'Please add a payment method first' }, { status: 400 });
        }

        // Create transfer directly to cleaner (100% goes to cleaner)
        const transfer = await stripe.transfers.create({
            amount: Math.round(amount * 100), // cents
            currency: 'usd',
            destination: cleaner.stripeAccountId,
            description: `Tip from booking ${booking.id}`,
            metadata: {
                bookingId: booking.id,
                type: 'tip',
                customerId: session.user.id,
                cleanerId: cleaner.id
            }
        });

        // Update booking with tip
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                tipAmount: { increment: amount },
                tipPaidAt: new Date()
            }
        });

        // Notify cleaner about the tip
        const cleanerUser = cleaner.user;
        
        // SMS
        if (cleanerUser.phone) {
            try {
                await sendSMSNotification(
                    cleanerUser.id,
                    cleanerUser.phone,
                    `🎉 You received a $${amount.toFixed(2)} tip from ${booking.user.firstName || 'a customer'}! Thank you for your great work. - Fixelo`,
                    { bookingId: booking.id, type: 'TIP_RECEIVED' }
                );
            } catch (err) {
                console.error('Failed to send tip SMS:', err);
            }
        }

        // Email
        try {
            await sendEmailNotification(cleanerUser.id, {
                to: cleanerUser.email,
                subject: `You received a $${amount.toFixed(2)} tip! 🎉`,
                html: `
                    <h2>Great job! You've received a tip!</h2>
                    <p>Hi ${cleanerUser.firstName || 'there'},</p>
                    <p>${booking.user.firstName || 'A customer'} just tipped you <strong>$${amount.toFixed(2)}</strong> for your excellent service!</p>
                    <p>This tip goes 100% to you and has been added to your account.</p>
                    <p>Keep up the great work!</p>
                `
            }, { bookingId: booking.id, type: 'TIP_RECEIVED' });
        } catch (err) {
            console.error('Failed to send tip email:', err);
        }

        return NextResponse.json({
            success: true,
            message: `$${amount.toFixed(2)} tip sent to ${cleanerUser.firstName}!`,
            transferId: transfer.id
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid tip amount' }, { status: 400 });
        }
        console.error('Tip error:', error);
        return NextResponse.json({ error: 'Failed to process tip' }, { status: 500 });
    }
}

// Get tip status for a booking
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                tipAmount: true,
                tipPaidAt: true,
                status: true,
                userId: true
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            tipAmount: booking.tipAmount || 0,
            tipPaidAt: booking.tipPaidAt,
            canTip: booking.status === 'COMPLETED'
        });

    } catch (error) {
        console.error('Get tip error:', error);
        return NextResponse.json({ error: 'Failed to get tip info' }, { status: 500 });
    }
}
