import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const bookingSchema = z.object({
    serviceId: z.string(),
    homeDetails: z.object({
        bedrooms: z.number(),
        bathrooms: z.number(),
        hasPets: z.boolean(),
        squareFootage: z.number().optional().nullable(),
    }),
    schedule: z.object({
        date: z.string(), // ISO date string
        timeSlot: z.string(),
    }),
    address: z.object({
        street: z.string(),
        unit: z.string().optional().nullable(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
    }),
    addOns: z.array(z.string()),
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized: Please sign in to book.", { status: 401 });
        }

        const body = await req.json();

        // Validate body against schema
        const validation = bookingSchema.safeParse(body);
        if (!validation.success) {
            return new NextResponse("Invalid booking data", { status: 400 });
        }

        const { serviceId, homeDetails, schedule, address, addOns } = validation.data;
        const userId = session.user.id;

        // 1. Fetch Service & Pricing
        const service = await prisma.serviceType.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return new NextResponse("Service not found", { status: 400 });
        }

        let price = service.basePrice || 0;

        // Use DB-configured pricing multipliers from ServiceType (with fallback to 0)
        if (homeDetails.bedrooms > 1) {
            price += (homeDetails.bedrooms - 1) * (service.pricePerBed || 0);
        }
        if (homeDetails.bathrooms > 1) {
            price += (homeDetails.bathrooms - 1) * (service.pricePerBath || 0);
        }
        if (homeDetails.hasPets) {
            price += (service.pricePerPet || 0);
        }

        // Add-ons
        let addOnsTotal = 0;
        let dbAddOns: { id: string; price: number }[] = [];

        if (addOns && addOns.length > 0) {
            // Frontend may send IDs (UUIDs) or slugs - search by both
            dbAddOns = await prisma.addOn.findMany({
                where: {
                    OR: [
                        { id: { in: addOns } },
                        { slug: { in: addOns } }
                    ]
                }
            });
            addOnsTotal = dbAddOns.reduce((acc, curr) => acc + curr.price, 0);
            price += addOnsTotal;
        }

        const totalPrice = price;

        // 2. Create PaymentIntent
        const stripe = await getStripeClient();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100), // cents
            currency: 'usd',
            metadata: {
                userId,
                serviceName: service.name
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // 3. Create or find Address and link to booking
        const addressRecord = await prisma.address.create({
            data: {
                userId,
                street: address.street,
                unit: address.unit || null,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                isDefault: false,
            }
        });

        // 4. Create Booking Record (Pending Payment)
        const booking = await prisma.booking.create({
            data: {
                userId,
                serviceTypeId: serviceId,
                status: 'DRAFT', // Will be updated to PENDING by webhook after payment
                scheduledDate: new Date(schedule.date),
                timeWindow: schedule.timeSlot,
                estimatedDuration: service.baseTime,
                bedrooms: homeDetails.bedrooms,
                bathrooms: homeDetails.bathrooms,
                squareFootage: homeDetails.squareFootage,
                hasPets: homeDetails.hasPets,
                addressId: addressRecord.id, // Link to Address record
                addressSnapshot: address, // Also keep snapshot for historical purposes
                basePrice: service.basePrice,
                addOnsTotal: addOnsTotal,
                subtotal: totalPrice,
                stripeFee: 0,
                platformReserve: 0,
                totalPrice: totalPrice,
                stripePaymentIntentId: paymentIntent.id,
                addOns: {
                    create: dbAddOns.map((addon) => ({
                        addOnId: addon.id,
                        price: addon.price,
                    }))
                }
            }
        });

        return NextResponse.json({
            bookingId: booking.id,
            clientSecret: paymentIntent.client_secret,
            totalPrice
        });

    } catch (error) {
        console.error('Booking error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
