"use server";

import { prisma } from "@fixelo/database";
import { auth } from "@/lib/auth";
import { updateCleanerMetrics } from "@/lib/metrics";
import { UserRole, BookingStatus, AssignmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function acceptJob(bookingId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.CLEANER) {
        throw new Error("Unauthorized");
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!cleaner) throw new Error("Cleaner profile not found");

    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // 2. Atomic Update: Set Booking to ACCEPTED only if it is currently PENDING
        // This prevents race conditions where two cleaners accept simultaneously
        const updateResult = await tx.booking.updateMany({
            where: {
                id: bookingId,
                status: BookingStatus.PENDING
            },
            data: { status: BookingStatus.ACCEPTED }
        });

        if (updateResult.count === 0) {
            throw new Error("Job is no longer available (already accepted)");
        }

        // 3. Create Assignment (Safe to do now)
        await tx.cleanerAssignment.create({
            data: {
                bookingId: bookingId,
                cleanerId: cleaner.id,
                status: AssignmentStatus.ACCEPTED,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            }
        });

        // 4. Update Cleaner Metrics (Accepted Count)
        await tx.cleanerProfile.update({
            where: { id: cleaner.id },
            data: { totalJobsAccepted: { increment: 1 } }
        });
    });

    // Recalculate Rates (outside tx to avoid lock contention if complex)
    await updateCleanerMetrics(cleaner.id);

    revalidatePath("/cleaner/jobs");
    revalidatePath("/cleaner/dashboard");
    redirect(`/cleaner/jobs/${bookingId}`); // Redirect to details
}

export async function completeJob(bookingId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.CLEANER) {
        throw new Error("Unauthorized");
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });
    if (!cleaner) throw new Error("Cleaner profile not found");

    // 1. Update Booking
    await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED }
    });

    // 2. Increment Completed Count
    await prisma.cleanerProfile.update({
        where: { id: cleaner.id },
        data: { totalJobsCompleted: { increment: 1 } }
    });

    // 3. Update Metrics
    await updateCleanerMetrics(cleaner.id);

    revalidatePath(`/cleaner/jobs/${bookingId}`);
}

export async function updateAvailability(_formData: FormData) {
    // Implement availability update logic here
    // Parsing formData for monday_start, monday_end, etc.
}
