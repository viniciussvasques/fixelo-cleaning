import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';
import { findMatches } from '@/lib/matching';
import { sendEmailNotification } from '@/lib/email';
import { sendSMSNotification, SMS_TEMPLATES } from '@/lib/sms';
import { bookingConfirmationEmail, newJobOfferEmail } from '@/lib/email-templates';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const body = await req.json();

        const {
            paymentIntentId,
            serviceId,
            homeDetails,
            schedule,
            address,
            specialInstructions,
            addOns
        } = body;

        if (!paymentIntentId) {
            return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
        }

        // 1. Verify Payment with Stripe
        // Extract payment intent ID from client_secret (format: pi_xxxxx_secret_yyyy)
        const paymentIntentIdExtracted = paymentIntentId.split('_secret_')[0];

        const stripe = await getStripeClient();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdExtracted);

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
        }

        // Check if booking already exists to prevent duplicates on refresh
        const existingBooking = await prisma.booking.findUnique({
            where: { stripePaymentIntentId: paymentIntentIdExtracted }
        });

        if (existingBooking) {
            // If booking exists but is still DRAFT, update to PENDING (payment was confirmed)
            if (existingBooking.status === 'DRAFT') {
                const updatedBooking = await prisma.booking.update({
                    where: { id: existingBooking.id },
                    data: { status: 'PENDING' }
                });
                console.log(`[Booking Create] Updated existing booking ${existingBooking.id} from DRAFT to PENDING`);
                return NextResponse.json({ booking: updatedBooking, message: 'Booking status updated to PENDING' });
            }
            return NextResponse.json({ booking: existingBooking, message: 'Booking already exists' });
        }

        const service = await prisma.serviceType.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service invalid' }, { status: 400 });
        }

        const userId = session?.user?.id;

        // --- Resolved Add-ons ---
        // Frontend might send slugs or IDs. Let's resolve them all to actual database IDs.
        const resolvedAddOns = await prisma.addOn.findMany({
            where: {
                OR: [
                    { id: { in: addOns || [] } },
                    { slug: { in: addOns || [] } }
                ]
            }
        });

        // 4. Create Booking Transaction
        const booking = await prisma.$transaction(async (tx) => {
            const metadata = paymentIntent.metadata;
            const baseAmount = parseFloat(metadata.baseAmount || '0');
            const totalAmount = paymentIntent.amount / 100; // Final paid amount
            const discountAmount = parseFloat(metadata.discountAmount || '0');
            const referralCode = metadata.referralCode;
            const recurringId = metadata.recurringId || null;
            const discountType = metadata.discountType || 'none';
            const creditsUsed = metadata.creditsUsed === 'true';

            // Get financial settings for accurate fee calculation
            const financialSettings = await prisma.financialSettings.findFirst();
            const stripeFeePercent = financialSettings?.stripeFeePercent ?? 0.029;
            const stripeFeeFixed = financialSettings?.stripeFeeFixed ?? 0.30;
            const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;

            // Accurate Fee Logic using settings
            const stripeFee = (totalAmount * stripeFeePercent) + stripeFeeFixed;
            const insuranceFee = totalAmount * insuranceFeePercent;
            const netAmount = totalAmount - stripeFee;

            // Handle Credit Deduction
            if (userId && creditsUsed && discountAmount > 0) {
                // Determine how much of the discount was from credits (if both referral + credits were used)
                // For simplicity, let's assume credits were applied *after* the $20 referral if both exist.
                const friendDiscount = referralCode ? 20 : 0;
                const creditDeduction = Math.max(0, discountAmount - friendDiscount);

                if (creditDeduction > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { credits: { decrement: creditDeduction } }
                    });
                }
            }

            // Handle Referral Recording
            if (referralCode && userId) {
                const referrer = await tx.user.findUnique({
                    where: { referralCode }
                });
                if (referrer && referrer.id !== userId) {
                    await tx.referral.create({
                        data: {
                            referrerId: referrer.id,
                            referredId: userId,
                            status: 'PENDING'
                        }
                    });
                }
            }

            // Address logic
            let createdAddress = null;
            if (userId && address) {
                createdAddress = await tx.address.create({
                    data: {
                        userId: userId,
                        street: address.street,
                        unit: address.unit,
                        city: address.city,
                        state: address.state,
                        zipCode: address.zipCode,
                        latitude: address.latitude || 40.7128,
                        longitude: address.longitude || -74.0060,
                        isDefault: false
                    }
                });
            }

            // Create Booking
            const newBooking = await tx.booking.create({
                data: {
                    userId: userId || 'guest',
                    serviceTypeId: serviceId,
                    status: 'PENDING',
                    addressId: createdAddress?.id,
                    addressSnapshot: address,
                    scheduledDate: new Date(schedule.date),
                    timeWindow: schedule.timeSlot,
                    estimatedDuration: service.baseTime,
                    bedrooms: homeDetails.bedrooms,
                    bathrooms: homeDetails.bathrooms,
                    // Recurring booking link
                    recurringId: recurringId || undefined,
                    discountPercent: discountType.includes('recurring') ? (discountAmount / baseAmount) : 0,
                    discountAmount: discountAmount,
                    hasPets: homeDetails.hasPets,
                    squareFootage: homeDetails.squareFootage,
                    specialInstructions: specialInstructions,
                    basePrice: baseAmount,
                    subtotal: totalAmount,
                    addOnsTotal: 0,
                    stripeFee: stripeFee,
                    platformReserve: insuranceFee,
                    totalPrice: totalAmount,
                    stripePaymentIntentId: paymentIntentIdExtracted,
                    ...(resolvedAddOns.length > 0 ? {
                        addOns: {
                            create: resolvedAddOns.map((ao) => ({
                                addOnId: ao.id,
                                price: ao.price
                            }))
                        }
                    } : {})
                }
            });

            // Create Payment Record
            await tx.payment.create({
                data: {
                    bookingId: newBooking.id,
                    amount: totalAmount,
                    stripeFee: stripeFee,
                    platformReserve: insuranceFee,
                    netAmount: netAmount,
                    stripePaymentIntentId: paymentIntentIdExtracted,
                    status: 'SUCCEEDED',
                    paidAt: new Date(),
                }
            });

            return newBooking;
        });

        // 5. Send Booking Confirmation to Customer
        if (userId && session?.user?.email) {
            try {
                // Get user details
                const customer = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, phone: true }
                });

                // Send confirmation email
                const emailData = bookingConfirmationEmail({
                    customerName: customer?.firstName || 'Customer',
                    bookingId: booking.id,
                    serviceName: service?.name || 'Cleaning',
                    scheduledDate: booking.scheduledDate,
                    scheduledTime: booking.timeWindow || 'TBD',
                    address: address ? `${address.street}, ${address.city}` : 'Address on file',
                    totalPrice: booking.totalPrice,
                });
                emailData.to = session.user.email;

                await sendEmailNotification(userId, emailData, { bookingId: booking.id, type: 'BOOKING_CONFIRMATION' });
                console.log(`✅ Booking confirmation email sent to ${session.user.email}`);

                // Send SMS if phone available
                if (customer?.phone) {
                    const smsMessage = SMS_TEMPLATES.bookingConfirmation(
                        customer.firstName || 'Customer',
                        new Date(booking.scheduledDate).toLocaleDateString(),
                        booking.timeWindow || 'TBD'
                    );
                    await sendSMSNotification(userId, customer.phone, smsMessage, { bookingId: booking.id, type: 'BOOKING_CONFIRMATION' });
                    console.log(`✅ Booking confirmation SMS sent to ${customer.phone}`);
                }
            } catch (notifError) {
                console.error('❌ Error sending booking confirmation:', notifError);
            }
        }

        // 6. Trigger Matching Algorithm (Async but awaited for MVP response simplicity)
        try {
            console.log(`🔍 Finding matches for Booking ${booking.id}...`);
            const potentialMatches = await findMatches(booking.id);

            // Top 3 Matches
            const topCleaners = potentialMatches.slice(0, 3);
            // console.log(`Found ${topCleaners.length} qualified candidates.`);

            // Create Assignments
            if (topCleaners.length > 0) {
                await prisma.cleanerAssignment.createMany({
                    data: topCleaners.map(m => ({
                        bookingId: booking.id,
                        cleanerId: m.cleaner.id,
                        status: 'PENDING',
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
                    }))
                });

                // Get financial settings for payout calculation
                const financialSettings = await prisma.financialSettings.findFirst();
                const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
                const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;
                const stripeFeePercent = financialSettings?.stripeFeePercent ?? 0.029;
                const stripeFeeFixed = financialSettings?.stripeFeeFixed ?? 0.30;

                // Send Email + SMS Notifications to cleaners
                for (const match of topCleaners) {
                    const cleanerUser = match.cleaner.user;
                    // Calculate NET payout: Total - Stripe - Platform - Insurance
                    const stripeFee = (booking.totalPrice * stripeFeePercent) + stripeFeeFixed;
                    const estimatedPayout = (booking.totalPrice - stripeFee) * (1 - platformFeePercent - insuranceFeePercent);

                    // Send Email using template
                    try {
                        const emailData = newJobOfferEmail({
                            cleanerName: cleanerUser.firstName || 'Pro',
                            serviceName: service?.name || 'Cleaning',
                            address: address?.city || 'See app',
                            scheduledDate: booking.scheduledDate,
                            scheduledTime: booking.timeWindow || 'TBD',
                            estimatedPayout,
                            bookingId: booking.id,
                        });
                        emailData.to = cleanerUser.email;

                        await sendEmailNotification(cleanerUser.id, emailData, { bookingId: booking.id, type: 'JOB_OFFER' });
                        console.log(`✅ Job offer email sent to ${cleanerUser.email}`);
                    } catch (error) {
                        console.error(`❌ Error sending email to cleaner ${cleanerUser.id}:`, error);
                    }

                    // Send SMS if phone available
                    if (cleanerUser.phone) {
                        try {
                            const smsMessage = SMS_TEMPLATES.jobOffer(
                                cleanerUser.firstName || 'Pro',
                                address?.city || 'See app',
                                new Date(booking.scheduledDate).toLocaleDateString(),
                                estimatedPayout
                            );
                            await sendSMSNotification(cleanerUser.id, cleanerUser.phone, smsMessage, { bookingId: booking.id, type: 'JOB_OFFER' });
                            console.log(`✅ Job offer SMS sent to ${cleanerUser.phone}`);
                        } catch (error) {
                            console.error(`❌ Error sending SMS to cleaner ${cleanerUser.id}:`, error);
                        }
                    }
                }

                // Increment Offer Count for Metrics
                await prisma.cleanerProfile.updateMany({
                    where: { id: { in: topCleaners.map(t => t.cleaner.id) } },
                    data: { totalJobsOffered: { increment: 1 } }
                });

                console.log(`Blasted notifications to ${topCleaners.length} cleaners.`);
            } else {
                console.warn('⚠️ No matches found for this booking immediately.');
                // Trigger "Manual Review" or "Broad Blast" fallback logic here
            }

        } catch (matchError) {
            console.error('Matching Error:', matchError);
            // Verify: Should not fail the booking response if matching fails, just log it.
        }

        return NextResponse.json({ booking });

    } catch (error) {
        console.error('Booking creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}
