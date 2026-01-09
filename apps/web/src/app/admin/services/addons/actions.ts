"use server";

import { prisma } from "@fixelo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const addOnSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    timeAdded: z.coerce.number().min(0, "Time must be positive"),
    isActive: z.boolean().default(true),
});

export async function createAddOn(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        price: formData.get("price"),
        timeAdded: formData.get("timeAdded"),
        isActive: formData.get("isActive") === "on",
    };

    const validatedFields = addOnSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await prisma.addOn.create({
            data: validatedFields.data,
        });
    } catch (_error) {
        return { error: "Failed to create add-on. Slug might be taken." };
    }

    revalidatePath("/admin/services/addons");
    redirect("/admin/services/addons");
}

export async function updateAddOn(id: string, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        price: formData.get("price"),
        timeAdded: formData.get("timeAdded"),
        isActive: formData.get("isActive") === "on",
    };

    const validatedFields = addOnSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await prisma.addOn.update({
            where: { id },
            data: validatedFields.data,
        });
    } catch (_error) {
        return { error: "Failed to update add-on." };
    }

    revalidatePath("/admin/services/addons");
    redirect("/admin/services/addons");
}

export async function deleteAddOn(id: string) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.addOn.delete({
            where: { id },
        });
    } catch (_error) {
        return { error: "Failed to delete add-on." };
    }

    revalidatePath("/admin/services/addons");
}
