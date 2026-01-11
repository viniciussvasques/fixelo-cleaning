"use server";

import { prisma } from "@fixelo/database";
import { auth } from "@/lib/auth";
import { updateCleanerMetrics } from "@/lib/metrics";
import { UserRole, BookingStatus, AssignmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function acceptJob(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.CLEANER) {
        throw new Error("Unauthorized");
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!cleaner) throw new Error("Cleaner profile not found");

    // Try to find assignment first (new flow), then booking (legacy)
    const existingAssignment = await prisma.cleanerAssignment.findUnique({
        where: { id },
        include: { booking: true }
    });

    let bookingId: string;
    let assignmentId: string | undefined;

    if (existingAssignment) {
        // New flow: id is assignment.id
        bookingId = existingAssignment.bookingId;
        assignmentId = existingAssignment.id;
    } else {
        // Legacy flow: id is booking.id
        bookingId = id;
    }

    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        if (existingAssignment) {
            // Update existing assignment to ACCEPTED
            await tx.cleanerAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: AssignmentStatus.ACCEPTED,
                    acceptedAt: new Date()
                }
            });

            // Cancel other pending assignments for this booking
            await tx.cleanerAssignment.updateMany({
                where: {
                    bookingId,
                    id: { not: assignmentId },
                    status: AssignmentStatus.PENDING
                },
                data: { status: AssignmentStatus.CANCELLED }
            });
        } else {
            // Legacy: Create new assignment
            await tx.cleanerAssignment.create({
                data: {
                    bookingId,
                    cleanerId: cleaner.id,
                    status: AssignmentStatus.ACCEPTED,
                    acceptedAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
                }
            });
        }

        // Update Booking status
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

        // Update Cleaner Metrics
        await tx.cleanerProfile.update({
            where: { id: cleaner.id },
            data: { totalJobsAccepted: { increment: 1 } }
        });
    });

    // Recalculate Rates
    await updateCleanerMetrics(cleaner.id);

    revalidatePath("/cleaner/jobs");
    revalidatePath("/cleaner/dashboard");
    redirect(`/cleaner/jobs/${assignmentId || bookingId}`);
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
