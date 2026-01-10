import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import Stripe from 'stripe';
import { findMatches } from '@/lib/matching';
import { sendEmailNotification } from '@/lib/email';
import { bookingConfirmationEmail, newJobOfferEmail, cleanerAssignedEmail } from '@/lib/email-templates';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // Get stripe client and webhook secret dynamically from DB
        const stripe = await getStripeClient();
        const webhookSecret = await getStripeWebhookSecret();

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
        case 'account.updated': {
            const account = event.data.object as Stripe.Account;
            await handleAccountUpdated(account);
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
        where: { stripePaymentIntentId: paymentIntent.id },
        include: {
            user: true,
            serviceType: true,
        }
    });

    if (!booking) {
        console.error(`[Webhook] No booking found for failed PaymentIntent: ${paymentIntent.id}`);
        return;
    }

    // Keep booking in DRAFT status (payment failed)
    console.log(`[Webhook] Payment failed for booking ${booking.id}`);

    // Send notification to customer about failed payment
    try {
        await sendEmailNotification(booking.userId, {
            to: booking.user.email,
            subject: 'Payment Issue - Action Required | Fixelo',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">Payment Failed</h1>
                    <p>Hi ${booking.user.firstName || 'there'},</p>
                    <p>Unfortunately, we couldn't process your payment for your cleaning service booking.</p>
                    
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <strong>Booking Details:</strong>
                        <ul>
                            <li>Service: ${booking.serviceType?.name || 'Cleaning Service'}</li>
                            <li>Date: ${new Date(booking.scheduledDate).toLocaleDateString()}</li>
                            <li>Amount: $${booking.totalPrice.toFixed(2)}</li>
                        </ul>
                    </div>
                    
                    <p><strong>What to do next:</strong></p>
                    <ol>
                        <li>Check that your card has sufficient funds</li>
                        <li>Verify your card details are correct</li>
                        <li>Try a different payment method</li>
                    </ol>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/book/review" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Retry Payment
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you continue to experience issues, please contact us at support@fixelo.app
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #999; font-size: 12px;">
                        © ${new Date().getFullYear()} Fixelo. All rights reserved.
                    </p>
                </div>
            `,
        }, { bookingId: booking.id, type: 'PAYMENT_FAILED' });

        console.log(`[Webhook] Sent payment failed notification to ${booking.user.email}`);
    } catch (err) {
        console.error(`[Webhook] Failed to send payment failed notification:`, err);
    }
}

/**
 * Handle Stripe Connect account updates
 * Updates cleaner verification status based on charges_enabled/payouts_enabled
 */
async function handleAccountUpdated(account: Stripe.Account) {
    const accountId = account.id;

    console.log(`[Webhook] Account updated: ${accountId}`);
    console.log(`[Webhook] charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);

    // Find cleaner by stripeAccountId
    const cleaner = await prisma.cleanerProfile.findFirst({
        where: { stripeAccountId: accountId },
        include: { user: true },
    });

    if (!cleaner) {
        console.log(`[Webhook] No cleaner found for account ${accountId}`);
        return;
    }

    // Determine new status
    const isFullyVerified = account.charges_enabled && account.payouts_enabled;
    const newStatus = isFullyVerified ? 'APPROVED' : 'PENDING';

    // Update cleaner profile
    await prisma.cleanerProfile.update({
        where: { id: cleaner.id },
        data: {
            verificationStatus: newStatus,
            // Also update main status if fully verified
            ...(isFullyVerified && { status: 'ACTIVE' }),
        },
    });

    console.log(`[Webhook] Updated cleaner ${cleaner.id} verification status to ${newStatus}`);

    // Send notification if just approved
    if (isFullyVerified && cleaner.verificationStatus !== 'APPROVED') {
        try {
            await sendEmailNotification(cleaner.userId, {
                to: cleaner.user.email,
                subject: '🎉 Your Stripe Account is Verified! | Fixelo',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #22c55e;">Congratulations! You're All Set 🎉</h1>
                        <p>Hi ${cleaner.user.firstName || 'there'},</p>
                        <p>Great news! Your Stripe account has been verified and you can now receive payments for cleaning jobs.</p>
                        
                        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #166534;"><strong>✔ Verification Complete</strong></p>
                            <p style="margin: 10px 0 0 0; color: #166534;">You're ready to accept jobs and get paid!</p>
                        </div>
                        
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/cleaner/dashboard" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Go to Dashboard
                            </a>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px;">
                            © ${new Date().getFullYear()} Fixelo. All rights reserved.
                        </p>
                    </div>
                `,
            }, { type: 'STRIPE_VERIFIED' });
            console.log(`[Webhook] Sent verification success email to ${cleaner.user.email}`);
        } catch (err) {
            console.error(`[Webhook] Failed to send verification email:`, err);
        }
    }
}
