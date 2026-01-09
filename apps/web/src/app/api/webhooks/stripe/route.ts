import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import Stripe from 'stripe';
import { findMatches } from '@/lib/matching';
import { sendEmailNotification } from '@/lib/email';
import { bookingConfirmationEmail, newJobOfferEmail, cleanerAssignedEmail } from '@/lib/email-templates';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await handlePaymentSuccess(paymentIntent);
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await handlePaymentFailed(paymentIntent);
            break;
        }
        default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Find booking by PaymentIntent ID with related data
    const booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: {
            user: true,
            address: true,
            serviceType: true,
        }
    });

    if (!booking) {
        console.error(`[Webhook] No booking found for PaymentIntent: ${paymentIntent.id}`);
        return;
    }

    // Update booking status to PENDING (waiting for cleaner assignment)
    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'PENDING' }
    });

    console.log(`[Webhook] Booking ${booking.id} updated to PENDING`);

    // Create Payment record
    await prisma.payment.create({
        data: {
            bookingId: booking.id,
            amount: paymentIntent.amount / 100,
            stripeFee: 0,
            platformReserve: 0,
            netAmount: paymentIntent.amount / 100,
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null,
            status: 'SUCCEEDED',
            paidAt: new Date(),
        }
    });

    console.log(`[Webhook] Payment record created for booking ${booking.id}`);

    // Send booking confirmation email to customer
    try {
        const emailData = bookingConfirmationEmail({
            customerName: booking.user.firstName || 'Customer',
            bookingId: booking.id,
            serviceName: booking.serviceType?.name || 'Cleaning',
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.timeWindow || 'TBD',
            address: booking.address ? `${booking.address.street}, ${booking.address.city}` : 'Address on file',
            totalPrice: booking.totalPrice,
        });
        emailData.to = booking.user.email;

        await sendEmailNotification(booking.userId, emailData, { bookingId: booking.id, type: 'BOOKING_CONFIRMATION' });
        console.log(`[Webhook] Sent booking confirmation email to ${booking.user.email}`);
    } catch (err) {
        console.error(`[Webhook] Failed to send confirmation email:`, err);
    }

    // Trigger Cleaner Matching
    try {
        const matches = await findMatches(booking.id);

        if (matches.length > 0) {
            // Create assignment for the top match
            const topMatch = matches[0];
            await prisma.cleanerAssignment.create({
                data: {
                    bookingId: booking.id,
                    cleanerId: topMatch.cleaner.id,
                    status: 'PENDING',
                    matchScore: topMatch.score,
                    distanceKm: topMatch.distance,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
                }
            });

            await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'ASSIGNED' }
            });

            console.log(`[Webhook] Assigned cleaner ${topMatch.cleaner.id} to booking ${booking.id}`);

            // Send job offer email to cleaner
            try {
                const cleanerUser = topMatch.cleaner.user;
                const financialSettings = await prisma.financialSettings.findFirst();
                const platformFee = financialSettings?.platformFeePercent ?? 0.15;
                const estimatedPayout = booking.totalPrice * (1 - platformFee);

                const jobOfferData = newJobOfferEmail({
                    cleanerName: cleanerUser.firstName || 'Pro',
                    serviceName: booking.serviceType?.name || 'Cleaning',
                    address: booking.address ? `${booking.address.city}, ${booking.address.state}` : 'See app',
                    scheduledDate: booking.scheduledDate,
                    scheduledTime: booking.timeWindow || 'TBD',
                    estimatedPayout,
                    bookingId: booking.id,
                });
                jobOfferData.to = cleanerUser.email;

                await sendEmailNotification(cleanerUser.id, jobOfferData, { bookingId: booking.id, type: 'JOB_OFFER' });
                console.log(`[Webhook] Sent job offer email to ${cleanerUser.email}`);
            } catch (err) {
                console.error(`[Webhook] Failed to send job offer email:`, err);
            }
        } else {
            console.log(`[Webhook] No matching cleaners found for booking ${booking.id}`);
        }
    } catch (err) {
        console.error(`[Webhook] Matching failed for booking ${booking.id}:`, err);
    }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!booking) {
        console.error(`[Webhook] No booking found for failed PaymentIntent: ${paymentIntent.id}`);
        return;
    }

    // Keep booking in DRAFT status (payment failed)
    console.log(`[Webhook] Payment failed for booking ${booking.id}`);

    // TODO: Send notification to customer about failed payment
}
