import { PrismaClient, UserRole, CleanerStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Users
    const passwordHash = await hash('password123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@fixelo.app' },
        update: {},
        create: {
            email: 'admin@fixelo.app',
            passwordHash,
            firstName: 'System',
            lastName: 'Admin',
            role: UserRole.ADMIN,
            isActive: true,
        },
    });

    const cleanerUser = await prisma.user.upsert({
        where: { email: 'cleaner@fixelo.app' },
        update: {},
        create: {
            email: 'cleaner@fixelo.app',
            passwordHash,
            firstName: 'John',
            lastName: 'Cleaner',
            role: UserRole.CLEANER,
            isActive: true,
        },
    });

    // Cleaner Profile
    if (cleanerUser) {
        await prisma.cleanerProfile.upsert({
            where: { userId: cleanerUser.id },
            update: {},
            create: {
                userId: cleanerUser.id,
                serviceRadius: 10,
                status: CleanerStatus.ACTIVE,
                onboardingCompleted: true,
            },
        });
    }

    // Create service types
    const standardCleaning = await prisma.serviceType.upsert({
        where: { slug: 'standard' },
        update: {},
        create: {
            name: 'Standard Cleaning',
            slug: 'standard',
            description: 'Regular home cleaning service',
            basePrice: 109,
            inclusions: [
                'Dusting all surfaces',
                'Vacuum all floors',
                'Mop hard floors',
                'Bathroom cleaning (toilet, sink, shower)',
                'Kitchen surface cleaning',
                'Trash removal',
            ],
            exclusions: ['Inside oven', 'Inside fridge', 'Deep grout cleaning', 'Heavy grease'],
            baseTime: 120, // 2 hours
            timePerBed: 45,
            timePerBath: 30,
        },
    });

    const deepCleaning = await prisma.serviceType.upsert({
        where: { slug: 'deep' },
        update: {},
        create: {
            name: 'Deep Cleaning',
            slug: 'deep',
            description: 'Thorough deep cleaning service',
            basePrice: 169,
            inclusions: [
                'Everything in Standard Cleaning',
                'Inside oven cleaning',
                'Inside fridge cleaning',
                'Baseboards',
                'Cabinet exteriors',
                'Extra bathroom detail',
                'Heavy dust removal',
            ],
            exclusions: [],
            baseTime: 180, // 3 hours
            timePerBed: 60,
            timePerBath: 45,
        },
    });

    const airbnbCleaning = await prisma.serviceType.upsert({
        where: { slug: 'airbnb' },
        update: {},
        create: {
            name: 'Airbnb / Vacation Rental Cleaning',
            slug: 'airbnb',
            description: 'Turnover cleaning for vacation rentals',
            basePrice: 129,
            inclusions: [
                'Turnover cleaning',
                'Bed linens change',
                'Trash removal',
                'Bathroom reset',
                'Kitchen reset',
                'Basic restocking',
            ],
            exclusions: [],
            baseTime: 90, // 1.5 hours
            timePerBed: 30,
            timePerBath: 20,
        },
    });

    console.log('✅ Service types created:', {
        standardCleaning: standardCleaning.id,
        deepCleaning: deepCleaning.id,
        airbnbCleaning: airbnbCleaning.id,
    });

    // Create add-ons
    const insideOven = await prisma.addOn.upsert({
        where: { slug: 'inside-oven' },
        update: {},
        create: {
            name: 'Inside Oven Cleaning',
            slug: 'inside-oven',
            description: 'Deep clean inside oven',
            price: 25,
            timeAdded: 30,
        },
    });

    const insideFridge = await prisma.addOn.upsert({
        where: { slug: 'inside-fridge' },
        update: {},
        create: {
            name: 'Inside Fridge Cleaning',
            slug: 'inside-fridge',
            description: 'Deep clean inside refrigerator',
            price: 25,
            timeAdded: 30,
        },
    });

    const ecoProducts = await prisma.addOn.upsert({
        where: { slug: 'eco-products' },
        update: {},
        create: {
            name: 'Eco-Friendly Products',
            slug: 'eco-products',
            description: 'Use green cleaning products',
            price: 10,
            timeAdded: 0,
        },
    });

    const windowCleaning = await prisma.addOn.upsert({
        where: { slug: 'window-cleaning' },
        update: {},
        create: {
            name: 'Window Cleaning',
            slug: 'window-cleaning',
            description: 'Interior window cleaning',
            price: 35,
            timeAdded: 45,
        },
    });

    console.log('✅ Add-ons created:', {
        insideOven: insideOven.id,
        insideFridge: insideFridge.id,
        ecoProducts: ecoProducts.id,
        windowCleaning: windowCleaning.id,
    });

    // Create system config
    await prisma.systemConfig.upsert({
        where: { key: 'platform_commission' },
        update: {},
        create: {
            key: 'platform_commission',
            value: '0.30', // 30%
            description: 'Platform commission percentage (0.30 = 30%)',
        },
    });

    await prisma.systemConfig.upsert({
        where: { key: 'stripe_fee_percentage' },
        update: {},
        create: {
            key: 'stripe_fee_percentage',
            value: '0.029', // 2.9%
            description: 'Stripe fee percentage',
        },
    });

    await prisma.systemConfig.upsert({
        where: { key: 'stripe_fee_fixed' },
        update: {},
        create: {
            key: 'stripe_fee_fixed',
            value: '0.30', // $0.30
            description: 'Stripe fixed fee per transaction (USD)',
        },
    });

    await prisma.systemConfig.upsert({
        where: { key: 'insurance_reserve_percentage' },
        update: {},
        create: {
            key: 'insurance_reserve_percentage',
            value: '0.03', // 3%
            description: 'Insurance/reserve percentage',
        },
    });

    console.log('✅ System config created');
    console.log('✅ Admin user created (admin@fixelo.app / password123)');
    console.log('✅ Cleaner user created (cleaner@fixelo.app / password123)');

    console.log('✨ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
