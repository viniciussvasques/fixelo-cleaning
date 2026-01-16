"use server";

import { prisma } from "@fixelo/database";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function updateSystemConfig(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const platformFee = formData.get("platformFee");
    const maxBedrooms = formData.get("maxBedrooms");
    const maxBathrooms = formData.get("maxBathrooms");

    if (platformFee) {
        const feeValue = parseFloat(platformFee.toString().replace(',', '.'));
        const feePercent = feeValue / 100; // Convert from percentage to decimal (e.g., 15 -> 0.15)

        // Update SystemConfig
        await prisma.systemConfig.upsert({
            where: { key: 'platform_commission' },
            create: { key: 'platform_commission', value: feePercent.toString() },
            update: { value: feePercent.toString() }
        });

        // ALSO update FinancialSettings to keep in sync
        const existing = await prisma.financialSettings.findFirst();
        if (existing) {
            await prisma.financialSettings.update({
                where: { id: existing.id },
                data: { platformFeePercent: feePercent }
            });
        } else {
            await prisma.financialSettings.create({
                data: { platformFeePercent: feePercent }
            });
        }
    }

    if (maxBedrooms) {
        await prisma.systemConfig.upsert({
            where: { key: 'max_bedrooms' },
            create: { key: 'max_bedrooms', value: maxBedrooms.toString() },
            update: { value: maxBedrooms.toString() }
        });
    }

    if (maxBathrooms) {
        await prisma.systemConfig.upsert({
            where: { key: 'max_bathrooms' },
            create: { key: 'max_bathrooms', value: maxBathrooms.toString() },
            update: { value: maxBathrooms.toString() }
        });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
}
