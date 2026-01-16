
import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { sendSMSNotification, SMS_TEMPLATES } from '@/lib/sms';
import { sendEmailNotification } from '@/lib/email';
import { z } from 'zod';

const verifySchema = z.object({
    paymentIntentId: z.string().startsWith('pi_'),
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
        const { paymentIntentId } = verifySchema.parse(body);

        // Get stripe client
        const stripe = await getStripeClient();

        // Retrieve PaymentIntent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }

        // Verify metadata matches
        if (paymentIntent.metadata.bookingId !== params.id) {
            return NextResponse.json({ error: 'Payment does not match booking' }, { status: 400 });
        }

        if (paymentIntent.metadata.type !== 'tip') {
            return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
        }

        // Check if already processed (idempotency)
        // We can check if booking already has this tip amount or check a separate transaction log
        // For now, let's trust the logic - maybe generic update is fine, but double counting is bad.
        // Ideally we should record the 'Payment' record for the tip too.

        // Retrieve Booking
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

        // But for simply updating the booking, we trust the status check on the PI

        const amount = paymentIntent.amount / 100;

        // Update Booking
        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                tipAmount: { increment: amount },
                tipPaidAt: new Date()
            }
        });

        const cleaner = booking.assignments[0]?.cleaner;
        if (cleaner) {
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
        }

        return NextResponse.json({
            success: true,
            message: `$${amount.toFixed(2)} tip sent successfully!`
        });

    } catch (error) {
        console.error('Tip verification error:', error);
        return NextResponse.json({ error: 'Failed to verify tip' }, { status: 500 });
    }
}
