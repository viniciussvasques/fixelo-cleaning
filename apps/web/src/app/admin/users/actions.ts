"use server";

import { prisma } from "@fixelo/database";
import { CleanerStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function approveCleaner(cleanerId: string) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    // Update CleanerProfile status to ACTIVE
    const profile = await prisma.cleanerProfile.update({
        where: { id: cleanerId },
        data: {
            status: CleanerStatus.ACTIVE,
            onboardingCompleted: true
        },
        include: { user: true } // to get userId
    });

    // Ensure the user role is CLEANER
    await prisma.user.update({
        where: { id: profile.userId },
        data: { role: UserRole.CLEANER }
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/cleaner/${cleanerId}`);
    redirect("/admin/users");
}

export async function rejectCleaner(cleanerId: string) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    // You might want a 'REJECTED' status, but for now we can use SUSPENDED or delete
    // Let's use SUSPENDED/DEACTIVATED or plain delete if they are just applying
    // For safety, let's mark as SUSPENDED
    await prisma.cleanerProfile.update({
        where: { id: cleanerId },
        data: { status: CleanerStatus.SUSPENDED },
    });

    revalidatePath("/admin/users");
    redirect("/admin/users");
}
