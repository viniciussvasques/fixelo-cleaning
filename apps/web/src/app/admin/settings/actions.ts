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
        // Here we could update FinancialSettings or SystemConfig depending on architecture
        // For simplicity, let's upsert SystemConfig keys
        await prisma.systemConfig.upsert({
            where: { key: 'platform_commission' },
            create: { key: 'platform_commission', value: platformFee.toString() },
            update: { value: platformFee.toString() }
        });
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
}
