import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { getStripeClient } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const stripe = await getStripeClient();

        // Ensure user is authenticated? Ideally yes, but could be guest checkout too.
        // For now, let's assume we want to attach it to a user if they are logged in,
        // or just create payment intent.

        const body = await req.json();
        const { serviceId, homeDetails, addOns, referralCode, useCredits, recurringId } = body;

        // --- Validate Input ---
        if (!serviceId) {
            return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });
        }

        // --- Get Financial Settings ---
        const settings = await prisma.financialSettings.findFirst();
        const minBookingAmount = settings?.minBookingAmount ?? 60;

        // --- Calculate Price on Server Side --- 
        const service = await prisma.serviceType.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        let price = service.basePrice;

        // Bedrooms/Bathrooms/Pets pricing logic
        if (homeDetails.bedrooms > 1) price += (homeDetails.bedrooms - 1) * (service.pricePerBed || 20);
        if (homeDetails.bathrooms > 1) price += (homeDetails.bathrooms - 1) * (service.pricePerBath || 25);
        if (homeDetails.hasPets) price += (service.pricePerPet || 15);

        // Add-ons
        if (addOns && addOns.length > 0) {
            const selectedAddOns = await prisma.addOn.findMany({
                where: { 
                    OR: [
                        { id: { in: addOns } },
                        { slug: { in: addOns } }
                    ]
                }
            });
            price += selectedAddOns.reduce((sum: number, addon: { price: number }) => sum + addon.price, 0);
        }

        // --- Minimum Booking Amount Check ---
        if (price < minBookingAmount) {
            return NextResponse.json({
                error: `Minimum booking amount is $${minBookingAmount}. Please add more services or add-ons.`,
                minAmount: minBookingAmount,
                currentAmount: price
            }, { status: 400 });
        }

        // --- Apply Discounts ---
        let discount = 0;
        let discountType = '';

        // 0. Recurring Booking Discount
        if (recurringId && session?.user?.id) {
            const recurring = await prisma.recurringBooking.findFirst({
                where: { id: recurringId, userId: session.user.id, isActive: true }
            });
            if (recurring) {
                const recurringDiscount = price * recurring.discountPercent;
                discount += recurringDiscount;
                discountType = `recurring_${recurring.frequency.toLowerCase()}`;
                console.log(`[Payment] Applied ${recurring.frequency} discount: -$${recurringDiscount.toFixed(2)} (${(recurring.discountPercent * 100).toFixed(0)}%)`);
            }
        }

        // 1. Referral Discount ($20 for first-time users)
        if (referralCode) {
            const referrer = await prisma.user.findUnique({
                where: { referralCode }
            });

            if (referrer) {
                // Check if the current user (if logged in) or the email (if guest) is new
                const existingBookings = session?.user?.id
                    ? await prisma.booking.count({ where: { userId: session.user.id, status: { not: 'DRAFT' } } })
                    : 0;

                if (existingBookings === 0) {
                    discount += 20;
                    discountType = discountType ? `${discountType}+referral` : 'referral';
                }
            }
        }

        // 2. Wallet Credits
        if (useCredits && session?.user?.id) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { credits: true }
            });
            if (user && user.credits > 0) {
                const creditToUse = Math.min(user.credits, price - discount);
                discount += creditToUse;
                discountType = discountType ? `${discountType}+credits` : 'credits';
            }
        }

        const finalPrice = Math.max(0, price - discount);

        // Convert to cents for Stripe
        const amountInCents = Math.round(finalPrice * 100);

        // --- Create Payment Intent ---
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                serviceId,
                userId: session?.user?.id || 'guest',
                specialInstructions: body.specialInstructions || '',
                referralCode: referralCode || '',
                recurringId: recurringId || '',
                baseAmount: price.toString(),
                discountAmount: discount.toString(),
                discountType: discountType || 'none',
                finalAmount: finalPrice.toString(),
                creditsUsed: (useCredits && session?.user?.id && discount > 0) ? 'true' : 'false',
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            amount: finalPrice,
        });

    } catch (error: unknown) {
        console.error('Error creating payment intent:', error);
        // Log details if it's a Stripe error
        if (error && typeof error === 'object' && 'type' in error) {
            const stripeError = error as InstanceType<typeof Stripe.errors.StripeError>;
            console.error('Stripe Error Type:', stripeError.type);
            console.error('Stripe Error Code:', stripeError.code);
            console.error('Stripe Error Message:', stripeError.message);
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
