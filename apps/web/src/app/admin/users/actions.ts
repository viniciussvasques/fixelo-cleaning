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
    // For safety, let's mark as SUSPENDED
    await prisma.cleanerProfile.update({
        where: { id: cleanerId },
        data: { status: CleanerStatus.SUSPENDED },
    });

    revalidatePath("/admin/users");
    redirect("/admin/users");
}

export async function updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: 'CUSTOMER' | 'CLEANER' | 'ADMIN';
    isActive?: boolean;
}) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    // Prevent self-demotion
    if (userId === session.user.id && data.role && data.role !== 'ADMIN') {
        throw new Error("Cannot change your own admin role");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
            ...(data.role && { role: data.role as UserRole }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        }
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
}

export async function deleteUser(userId: string, hardDelete: boolean = false) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
        throw new Error("Cannot delete your own account");
    }

    if (hardDelete) {
        // Check for bookings before hard delete
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { _count: { select: { bookings: true } } }
        });

        if (user && user._count.bookings > 0) {
            throw new Error("Cannot permanently delete user with bookings");
        }

        await prisma.user.delete({ where: { id: userId } });
    } else {
        // Soft delete - deactivate
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });
    }

    revalidatePath("/admin/users");
    redirect("/admin/users");
}

export async function toggleUserStatus(userId: string) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    // Get current status
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true }
    });

    if (!user) {
        throw new Error("User not found");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
}
