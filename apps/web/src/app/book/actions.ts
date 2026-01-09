"use server";

import { prisma } from "@fixelo/database";

export async function getBookingConfig() {
    const [addOns, systemConfigs] = await Promise.all([
        prisma.addOn.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        }),
        prisma.systemConfig.findMany({
            where: {
                key: { in: ['max_bedrooms', 'max_bathrooms'] }
            }
        })
    ]);

    const maxBedrooms = parseInt(systemConfigs.find(c => c.key === 'max_bedrooms')?.value || '6');
    const maxBathrooms = parseInt(systemConfigs.find(c => c.key === 'max_bathrooms')?.value || '5');

    return {
        addOns,
        config: {
            maxBedrooms,
            maxBathrooms
        }
    };
}
