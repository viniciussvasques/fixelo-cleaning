/**
 * Job Execution API
 * 
 * Handles: Check-in, Start, Complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { BookingStatus, JobExecutionStatus } from '@prisma/client';
import { sendSMSNotification, SMS_TEMPLATES } from '@/lib/sms';
import { sendEmailNotification } from '@/lib/email';
import { isWithinCheckInRadius, formatDistance } from '@/lib/geofencing';

interface Props {
    params: { id: string };
}

/**
 * GET - Get job execution status and data
 */
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;

        // Verify cleaner is assigned to this job
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        // Try to find by assignmentId first (from dashboard link), then bookingId
        let bookingId: string;

        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id },
            select: { bookingId: true, cleanerId: true }
        });

        if (assignment) {
            // ID is assignmentId
            if (assignment.cleanerId !== cleaner.id) {
                return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
            }
            bookingId = assignment.bookingId;
        } else {
            // ID might be bookingId directly
            bookingId = id;
        }

        // Get job execution with all related data
        let jobExecution = await prisma.jobExecution.findUnique({
            where: { bookingId },
            include: {
                photos: {
                    orderBy: { createdAt: 'asc' }
                },
                checklist: {
                    orderBy: { sortOrder: 'asc' }
                },
                booking: {
                    include: {
                        serviceType: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                email: true
                            }
                        },
                        address: true
                    }
                }
            }
        });

        // If no execution exists, create one with checklist
        if (!jobExecution) {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { serviceType: true }
            });

            if (!booking) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }

            // Get checklist template for this service type
            const template = await prisma.checklistTemplate.findFirst({
                where: {
                    OR: [
                        { serviceTypeId: booking.serviceTypeId },
                        { isDefault: true }
                    ]
                },
                include: { items: { orderBy: { sortOrder: 'asc' } } },
                orderBy: { serviceTypeId: 'desc' } // Prefer service-specific template
            });

            jobExecution = await prisma.jobExecution.create({
                data: {
                    bookingId,
                    cleanerId: cleaner.id,
                    status: JobExecutionStatus.NOT_STARTED,
                    checklist: template ? {
                        create: template.items.map(item => ({
                            category: item.category,
                            task: item.task,
                            isRequired: item.isRequired,
                            sortOrder: item.sortOrder,
                        }))
                    } : undefined
                },
                include: {
                    photos: true,
                    checklist: { orderBy: { sortOrder: 'asc' } },
                    booking: {
                        include: {
                            serviceType: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    email: true
                                }
                            },
                            address: true
                        }
                    }
                }
            });
        }

        // Calculate progress
        const totalChecklist = jobExecution.checklist.length;
        const completedChecklist = jobExecution.checklist.filter(item => item.completed).length;
        const beforePhotos = jobExecution.photos.filter(p => p.type === 'BEFORE').length;
        const afterPhotos = jobExecution.photos.filter(p => p.type === 'AFTER').length;

        return NextResponse.json({
            ...jobExecution,
            progress: {
                checklist: totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0,
                beforePhotos,
                afterPhotos,
                requiredBeforePhotos: 3, // Minimum required
                requiredAfterPhotos: 3,
            }
        });

    } catch (error) {
        console.error('[JobExecution] GET error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to fetch job execution'
        }, { status: 500 });
    }
}

/**
 * PATCH - Update job execution (check-in, start, complete)
 */
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const body = await request.json();
        const { action, latitude, longitude } = body;

        // Verify cleaner is assigned
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        // Try to find by assignmentId first (from dashboard link), then bookingId
        let bookingId: string;

        const assignment = await prisma.cleanerAssignment.findUnique({
            where: { id },
            select: { bookingId: true, cleanerId: true }
        });

        if (assignment) {
            if (assignment.cleanerId !== cleaner.id) {
                return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
            }
            bookingId = assignment.bookingId;
        } else {
            bookingId = id;
        }

        const jobExecution = await prisma.jobExecution.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        user: true,
                        serviceType: true,
                        address: true
                    }
                },
                photos: true,
                checklist: true
            }
        });

        if (!jobExecution) {
            return NextResponse.json({ error: 'Job execution not found' }, { status: 404 });
        }

        if (jobExecution.cleanerId !== cleaner.id) {
            return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
        }

        const customer = jobExecution.booking.user;

        switch (action) {
            case 'CHECK_IN': {
                if (jobExecution.status !== JobExecutionStatus.NOT_STARTED) {
                    return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
                }

                // Geofencing validation
                const address = jobExecution.booking.address;
                if (latitude && longitude && address?.latitude && address?.longitude) {
                    const geoCheck = isWithinCheckInRadius(
                        latitude,
                        longitude,
                        address.latitude,
                        address.longitude
                    );

                    if (!geoCheck.valid) {
                        return NextResponse.json({
                            error: `You are ${formatDistance(geoCheck.distance)} away from the job location. Please move closer to check in (within ${formatDistance(geoCheck.maxDistance)}).`,
                            distance: geoCheck.distance,
                            maxDistance: geoCheck.maxDistance,
                            requiresOverride: true
                        }, { status: 400 });
                    }
                }

                const updated = await prisma.jobExecution.update({
                    where: { id: jobExecution.id },
                    data: {
                        status: JobExecutionStatus.CHECKED_IN,
                        checkedInAt: new Date(),
                        checkinLat: latitude,
                        checkinLng: longitude
                    }
                });

                // Update booking status
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: BookingStatus.IN_PROGRESS }
                });

                // Notify customer
                if (customer.phone) {
                    try {
                        await sendSMSNotification(
                            customer.id,
                            customer.phone,
                            `Hi ${customer.firstName}! Your cleaner ${session.user.name || 'has'} just arrived at your location. The cleaning is about to begin! 🏠`,
                            { bookingId, type: 'CLEANER_ARRIVED' }
                        );
                    } catch (err) {
                        console.error('Failed to send arrival SMS:', err);
                    }
                }

                return NextResponse.json({
                    success: true,
                    status: updated.status,
                    message: 'Checked in successfully'
                });
            }

            case 'START': {
                if (jobExecution.status !== JobExecutionStatus.CHECKED_IN) {
                    return NextResponse.json({
                        error: 'Must check in first or already started'
                    }, { status: 400 });
                }

                // Verify minimum before photos
                const beforePhotos = jobExecution.photos.filter(p => p.type === 'BEFORE');
                if (beforePhotos.length < 3) {
                    return NextResponse.json({
                        error: `Please take at least 3 "before" photos. You have ${beforePhotos.length}.`
                    }, { status: 400 });
                }

                const updated = await prisma.jobExecution.update({
                    where: { id: jobExecution.id },
                    data: {
                        status: JobExecutionStatus.IN_PROGRESS,
                        startedAt: new Date()
                    }
                });

                return NextResponse.json({
                    success: true,
                    status: updated.status,
                    message: 'Job started'
                });
            }

            case 'COMPLETE': {
                if (jobExecution.status !== JobExecutionStatus.IN_PROGRESS) {
                    return NextResponse.json({
                        error: 'Job must be in progress to complete'
                    }, { status: 400 });
                }

                // Verify minimum after photos
                const afterPhotos = jobExecution.photos.filter(p => p.type === 'AFTER');
                if (afterPhotos.length < 3) {
                    return NextResponse.json({
                        error: `Please take at least 3 "after" photos. You have ${afterPhotos.length}.`
                    }, { status: 400 });
                }

                // Verify required checklist items completed
                const requiredIncomplete = jobExecution.checklist.filter(
                    item => item.isRequired && !item.completed
                );
                if (requiredIncomplete.length > 0) {
                    return NextResponse.json({
                        error: `Please complete all required checklist items. ${requiredIncomplete.length} remaining.`,
                        incompleteItems: requiredIncomplete.map(i => i.task)
                    }, { status: 400 });
                }

                // Complete the job
                const updated = await prisma.jobExecution.update({
                    where: { id: jobExecution.id },
                    data: {
                        status: JobExecutionStatus.COMPLETED,
                        completedAt: new Date(),
                        checkoutLat: latitude,
                        checkoutLng: longitude
                    }
                });

                // Update booking
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: BookingStatus.COMPLETED
                    }
                });

                // Update cleaner metrics
                await prisma.cleanerProfile.update({
                    where: { id: cleaner.id },
                    data: {
                        jobsCompleted: { increment: 1 },
                        totalJobsCompleted: { increment: 1 }
                    }
                });

                // Notify customer
                if (customer.phone) {
                    try {
                        await sendSMSNotification(
                            customer.id,
                            customer.phone,
                            `Hi ${customer.firstName}! Your cleaning is complete! ✨ Please rate your experience: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/review`,
                            { bookingId, type: 'JOB_COMPLETED' }
                        );
                    } catch (err) {
                        console.error('Failed to send completion SMS:', err);
                    }
                }

                if (customer.email) {
                    try {
                        await sendEmailNotification(customer.id, {
                            to: customer.email,
                            subject: 'Your Cleaning is Complete! ✨',
                            html: `
                                <h2>Your home is sparkling clean!</h2>
                                <p>Hi ${customer.firstName},</p>
                                <p>Your cleaning service has been completed. We hope you love your fresh, clean home!</p>
                                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/review">Leave a review</a></p>
                                <p>Thank you for choosing Fixelo!</p>
                            `
                        }, { bookingId, type: 'JOB_COMPLETED' });
                    } catch (err) {
                        console.error('Failed to send completion email:', err);
                    }
                }

                return NextResponse.json({
                    success: true,
                    status: updated.status,
                    message: 'Job completed successfully!'
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('[JobExecution] PATCH error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to update job execution'
        }, { status: 500 });
    }
}
