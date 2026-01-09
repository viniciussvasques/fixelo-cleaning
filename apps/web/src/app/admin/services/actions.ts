"use server";

import { prisma } from "@fixelo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const serviceSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters"),
    description: z.string().optional(),
    basePrice: z.coerce.number().min(0, "Price must be positive"),
    baseTime: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
    timePerBed: z.coerce.number().default(0),
    timePerBath: z.coerce.number().default(0),
    pricePerBed: z.coerce.number().default(20),
    pricePerBath: z.coerce.number().default(25),
    pricePerPet: z.coerce.number().default(15),
    isActive: z.boolean().default(true),
    inclusions: z.string().transform((str) => str.split('\n').filter(s => s.trim().length > 0)),
    exclusions: z.string().transform((str) => str.split('\n').filter(s => s.trim().length > 0)).optional(),
});

export async function createService(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        basePrice: formData.get("basePrice"),
        baseTime: formData.get("baseTime"),
        timePerBed: formData.get("timePerBed"),
        timePerBath: formData.get("timePerBath"),
        pricePerBed: formData.get("pricePerBed"),
        pricePerBath: formData.get("pricePerBath"),
        pricePerPet: formData.get("pricePerPet"),
        isActive: formData.get("isActive") === "on",
        inclusions: formData.get("inclusions"),
        exclusions: formData.get("exclusions"),
    };

    const validatedFields = serviceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { inclusions, exclusions, ...data } = validatedFields.data;

    try {
        await prisma.serviceType.create({
            data: {
                ...data,
                inclusions: inclusions,
                exclusions: exclusions ?? [],
            },
        });
    } catch (_error) {
        return { error: "Failed to create service. Slug might be taken." };
    }

    revalidatePath("/admin/services");
    redirect("/admin/services");
}

export async function updateService(id: string, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        basePrice: formData.get("basePrice"),
        baseTime: formData.get("baseTime"),
        timePerBed: formData.get("timePerBed"),
        timePerBath: formData.get("timePerBath"),
        isActive: formData.get("isActive") === "on",
        inclusions: formData.get("inclusions"),
        exclusions: formData.get("exclusions"),
    };

    const validatedFields = serviceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { inclusions, exclusions, ...data } = validatedFields.data;

    try {
        await prisma.serviceType.update({
            where: { id },
            data: {
                ...data,
                inclusions: inclusions,
                exclusions: exclusions ?? [],
            },
        });
    } catch (_error) {
        return { error: "Failed to update service." };
    }

    revalidatePath("/admin/services");
    redirect("/admin/services");
}
