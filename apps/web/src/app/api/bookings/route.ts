import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { stripe } from '@/lib/stripe';
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

        let price = service.basePrice;

        // Use DB-configured pricing multipliers from ServiceType
        if (homeDetails.bedrooms > 1) {
            price += (homeDetails.bedrooms - 1) * service.pricePerBed;
        }
        if (homeDetails.bathrooms > 1) {
            price += (homeDetails.bathrooms - 1) * service.pricePerBath;
        }
        if (homeDetails.hasPets) {
            price += service.pricePerPet;
        }

        // Add-ons
        let addOnsTotal = 0;
        let dbAddOns: { id: string; price: number }[] = [];

        if (addOns && addOns.length > 0) {
            // Frontend sends slugs (e.g., 'inside-oven'), so we check 'slug' or 'id'
            // Ideally we standardise, but let's check slug first as that matches the hardcoded frontend values
            dbAddOns = await prisma.addOn.findMany({
                where: {
                    slug: { in: addOns }
                }
            });
            addOnsTotal = dbAddOns.reduce((acc, curr) => acc + curr.price, 0);
            price += addOnsTotal;
        }

        const totalPrice = price;

        // 2. Create PaymentIntent
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

        // 3. Create Booking Record (Pending Payment)
        // We need to create/find Address record first if we want to link it properly, 
        // or just store snapshot. Schema says addressSnapshot is Json, addressId is optional.

        const booking = await prisma.booking.create({
            data: {
                userId,
                serviceTypeId: serviceId,
                status: 'DRAFT', // or PENDING
                scheduledDate: new Date(schedule.date),
                timeWindow: schedule.timeSlot,
                estimatedDuration: service.baseTime, // Simplify for now
                bedrooms: homeDetails.bedrooms,
                bathrooms: homeDetails.bathrooms,
                squareFootage: homeDetails.squareFootage,
                hasPets: homeDetails.hasPets,
                addressSnapshot: address, // Prisma Json type
                basePrice: service.basePrice,
                addOnsTotal: addOnsTotal,
                subtotal: totalPrice,
                stripeFee: 0, // calc later or ignore for MVP
                platformReserve: 0,
                totalPrice: totalPrice,
                stripePaymentIntentId: paymentIntent.id,
                // Add relations for addons using the found DB records (which have the correct UUIDs)
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
