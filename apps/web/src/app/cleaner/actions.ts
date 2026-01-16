"use server";

import { prisma } from "@fixelo/database";
import { auth } from "@/lib/auth";
import { updateCleanerMetrics } from "@/lib/metrics";
import { UserRole, BookingStatus, AssignmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmailNotification } from "@/lib/email";
import { sendSMSNotification, SMS_TEMPLATES } from "@/lib/sms";
import { cleanerAssignedEmail } from "@/lib/email-templates";

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

    // Check for conflicting jobs in the same time window
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { scheduledDate: true, timeWindow: true }
    });

    if (booking) {
        const [startTime, endTime] = booking.timeWindow.split('-');
        const targetDate = new Date(booking.scheduledDate);

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Parse time to minutes for comparison
        const parseTime = (timeStr: string): number => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + (minutes || 0);
        };

        const targetStart = parseTime(startTime);
        const targetEnd = parseTime(endTime);

        // Check for existing accepted jobs that overlap
        const existingJobs = await prisma.cleanerAssignment.findMany({
            where: {
                cleanerId: cleaner.id,
                status: AssignmentStatus.ACCEPTED,
                booking: {
                    id: { not: bookingId },
                    scheduledDate: { gte: startOfDay, lte: endOfDay },
                    status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] }
                }
            },
            include: {
                booking: { select: { timeWindow: true, serviceType: { select: { name: true } } } }
            }
        });

        for (const job of existingJobs) {
            const [jobStart, jobEnd] = job.booking.timeWindow.split('-');
            const jobStartMin = parseTime(jobStart);
            const jobEndMin = parseTime(jobEnd);

            // Check for overlap
            if (targetStart < jobEndMin && targetEnd > jobStartMin) {
                throw new Error(`You already have a job (${job.booking.serviceType.name}) scheduled for ${job.booking.timeWindow} on this day. You cannot accept overlapping jobs.`);
            }
        }
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

    // Send notification to customer
    try {
        const bookingWithDetails = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: true,
                serviceType: true,
            }
        });

        const cleanerWithUser = await prisma.cleanerProfile.findUnique({
            where: { id: cleaner.id },
            include: { user: true }
        });

        if (bookingWithDetails?.user && cleanerWithUser) {
            const customer = bookingWithDetails.user;
            const cleanerName = `${cleanerWithUser.user.firstName || ''} ${cleanerWithUser.user.lastName || ''}`.trim() || 'Your Cleaner';

            // Send "Cleaner Assigned" email to customer
            const emailData = cleanerAssignedEmail({
                customerName: customer.firstName || 'Customer',
                cleanerName,
                cleanerRating: cleanerWithUser.rating || 5.0,
                scheduledDate: bookingWithDetails.scheduledDate,
                scheduledTime: bookingWithDetails.timeWindow || 'TBD',
            });
            emailData.to = customer.email;

            await sendEmailNotification(customer.id, emailData, {
                bookingId,
                type: 'CLEANER_ASSIGNED'
            });

            // Send SMS if phone available
            if (customer.phone) {
                const smsMessage = SMS_TEMPLATES.cleanerAssigned(
                    customer.firstName || 'Customer',
                    cleanerName
                );
                await sendSMSNotification(customer.id, customer.phone, smsMessage, {
                    bookingId,
                    type: 'CLEANER_ASSIGNED'
                });
            }
        }
    } catch (notifError) {
        console.error('Error sending cleaner assigned notification:', notifError);
    }

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
        where: { userId: session.user.id },
        include: { user: true }
    });
    if (!cleaner) throw new Error("Cleaner profile not found");

    // 1. Update Booking
    const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
        include: {
            user: true,
            serviceType: true,
        }
    });

    // 2. Increment Completed Count
    await prisma.cleanerProfile.update({
        where: { id: cleaner.id },
        data: { totalJobsCompleted: { increment: 1 } }
    });

    // 3. Update Metrics
    await updateCleanerMetrics(cleaner.id);

    // 4. Send notifications
    try {
        const customer = booking.user;

        // Send completion email to customer with review request
        await sendEmailNotification(customer.id, {
            to: customer.email,
            subject: 'Your Cleaning is Complete! Leave a Review 🌟',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #22c55e;">Cleaning Complete! ✨</h1>
                    <p>Hi ${customer.firstName || 'there'},</p>
                    <p>Your ${booking.serviceType?.name || 'cleaning'} has been completed.</p>
                    <p>We hope everything looks great! Your feedback helps us maintain high standards.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}/review" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Leave a Review
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Thank you for choosing Fixelo!
                    </p>
                </div>
            `,
        }, { bookingId, type: 'JOB_COMPLETED' });

        // SMS to customer
        if (customer.phone) {
            await sendSMSNotification(
                customer.id,
                customer.phone,
                `Your Fixelo cleaning is complete! ✨ Hope it looks great. Leave a review: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                { bookingId, type: 'JOB_COMPLETED' }
            );
        }
    } catch (notifError) {
        console.error('Error sending completion notifications:', notifError);
    }

    revalidatePath(`/cleaner/jobs/${bookingId}`);
}

export async function updateAvailability(_formData: FormData) {
    // Implement availability update logic here
    // Parsing formData for monday_start, monday_end, etc.
}

export async function cancelJobByAssignmentId(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.CLEANER) {
        throw new Error("Unauthorized");
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!cleaner) throw new Error("Cleaner profile not found");

    // Find the assignment
    const assignment = await prisma.cleanerAssignment.findUnique({
        where: { id },
        include: { booking: { include: { user: true } } }
    });

    if (!assignment) throw new Error("Assignment not found");
    if (assignment.cleanerId !== cleaner.id) throw new Error("Not your assignment");

    // Can only cancel if still ACCEPTED
    if (assignment.status !== AssignmentStatus.ACCEPTED) {
        throw new Error("Cannot cancel this job");
    }

    // Update assignment to REJECTED
    await prisma.cleanerAssignment.update({
        where: { id },
        data: { status: AssignmentStatus.REJECTED }
    });

    // Update booking status back to PENDING
    await prisma.booking.update({
        where: { id: assignment.bookingId },
        data: { status: BookingStatus.PENDING }
    });

    // Notify customer
    if (assignment.booking.user.email) {
        await sendEmailNotification(
            assignment.booking.user.id,
            {
                to: assignment.booking.user.email,
                subject: 'Job Cancelled by Cleaner',
                html: `<p>The cleaner has cancelled your booking. We'll find another cleaner for you.</p>`
            }
        );
    }

    revalidatePath('/cleaner/jobs');
    revalidatePath('/cleaner/dashboard');
    redirect('/cleaner/dashboard');
}
