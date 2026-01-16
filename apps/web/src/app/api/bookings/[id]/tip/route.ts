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

        // Get or create Stripe customer for this user
        let customer = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, firstName: true, stripeCustomerId: true }
        });

        let stripeCustomerId = customer?.stripeCustomerId;

        // If no customer exists, create one in Stripe
        if (!stripeCustomerId && customer) {
            const stripeCustomer = await stripe.customers.create({
                email: customer.email,
                name: customer.firstName || undefined,
                metadata: {
                    userId: customer.id
                }
            });
            stripeCustomerId = stripeCustomer.id;

            // Save the customer ID
            await prisma.user.update({
                where: { id: session.user.id },
                data: { stripeCustomerId }
            });
        }

        // Create a PaymentIntent for the tip
        // Try to reuse the card from the booking if available
        let reusedPaymentMethod = false;
        let paymentIntent;

        try {
            if (booking.stripePaymentIntentId) {
                const originalPi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
                if (originalPi.payment_method && typeof originalPi.payment_method === 'string') {
                    // We have a payment method.
                    // To reuse it, it must be attached to the Customer.
                    // Check if it is already attached to this customer
                    const paymentMethodId = originalPi.payment_method;

                    // Attach if needed
                    if (stripeCustomerId) {
                        try {
                            const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                            if (pm.customer !== stripeCustomerId) {
                                // Try to attach
                                await stripe.paymentMethods.attach(paymentMethodId, {
                                    customer: stripeCustomerId,
                                });
                            }

                            // Now try to create and confirm PI immediately
                            paymentIntent = await stripe.paymentIntents.create({
                                amount: Math.round(amount * 100),
                                currency: 'usd',
                                customer: stripeCustomerId,
                                payment_method: paymentMethodId,
                                confirm: true, // Try to charge immediately
                                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}`,
                                transfer_data: {
                                    destination: cleaner.stripeAccountId,
                                },
                                metadata: {
                                    bookingId: booking.id,
                                    type: 'tip',
                                    customerId: session.user.id,
                                    cleanerId: cleaner.id
                                },
                                description: `Tip for booking ${booking.id}`,
                            });

                            reusedPaymentMethod = true;

                        } catch (err) {
                            console.log('Failed to reuse payment method, falling back to new payment:', err);
                            // Fallback to creating a new one below
                        }
                    }
                }
            }
        } catch (err) {
            console.log('Error checking original payment intent:', err);
        }

        // If reuse failed or wasn't possible, create a fresh PI for the UI to handle
        if (!paymentIntent) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // cents
                currency: 'usd',
                customer: stripeCustomerId || undefined,
                automatic_payment_methods: {
                    enabled: true,
                },
                transfer_data: {
                    destination: cleaner.stripeAccountId,
                },
                metadata: {
                    bookingId: booking.id,
                    type: 'tip',
                    customerId: session.user.id,
                    cleanerId: cleaner.id
                },
                description: `Tip for booking ${booking.id}`,
            });
        }

        // Return client secret for frontend to complete payment
        if (paymentIntent.status === 'succeeded') {
            // One-click success! Update booking immediately

            // Update Booking
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
                paymentIntentId: paymentIntent.id
            });
        }

        return NextResponse.json({
            requiresPayment: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
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
