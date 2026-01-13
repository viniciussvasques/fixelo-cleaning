/**
 * Service Report API
 * 
 * Generates a comprehensive report of the completed job
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { sendEmailNotification } from '@/lib/email';

interface Props {
    params: { id: string };
}

/**
 * GET - Get or generate service report
 */
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;

        // Get booking with all details
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                serviceType: true,
                address: true,
                jobExecution: {
                    include: {
                        photos: {
                            orderBy: { createdAt: 'asc' }
                        },
                        checklist: {
                            orderBy: { sortOrder: 'asc' }
                        },
                        cleaner: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                },
                assignments: {
                    where: { status: 'ACCEPTED' },
                    include: {
                        cleaner: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify access (cleaner assigned or customer)
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        const isCustomer = booking.userId === session.user.id;
        const isCleaner = cleaner && booking.assignments.some(a => a.cleanerId === cleaner.id);

        if (!isCustomer && !isCleaner) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Check for existing report
        let report = await prisma.serviceReport.findUnique({
            where: { bookingId }
        });

        const execution = booking.jobExecution;

        // Generate report data
        const reportData = {
            booking: {
                id: booking.id,
                serviceName: booking.serviceType.name,
                scheduledDate: booking.scheduledDate,
                timeWindow: booking.timeWindow,
                bedrooms: booking.bedrooms,
                bathrooms: booking.bathrooms,
                totalPrice: booking.totalPrice,
                status: booking.status,
            },
            customer: {
                name: `${booking.user.firstName} ${booking.user.lastName}`,
            },
            address: booking.address ? {
                street: booking.address.street,
                city: booking.address.city,
                state: booking.address.state,
                zip: booking.address.zipCode,
            } : null,
            cleaner: booking.assignments[0]?.cleaner ? {
                name: `${booking.assignments[0].cleaner.user.firstName} ${booking.assignments[0].cleaner.user.lastName}`,
            } : null,
            execution: execution ? {
                checkedInAt: execution.checkedInAt,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                duration: execution.startedAt && execution.completedAt 
                    ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 60000)
                    : null,
            } : null,
            checklist: execution?.checklist.map(item => ({
                category: item.category,
                task: item.task,
                completed: item.completed,
                completedAt: item.completedAt,
            })) || [],
            photos: {
                before: execution?.photos.filter(p => p.type === 'BEFORE').map(p => ({
                    url: p.url,
                    room: p.room,
                    createdAt: p.createdAt,
                })) || [],
                after: execution?.photos.filter(p => p.type === 'AFTER').map(p => ({
                    url: p.url,
                    room: p.room,
                    createdAt: p.createdAt,
                })) || [],
            },
            summary: {
                checklistCompletion: execution?.checklist.length 
                    ? Math.round((execution.checklist.filter(c => c.completed).length / execution.checklist.length) * 100)
                    : 0,
                totalPhotos: (execution?.photos.length || 0),
                beforePhotos: (execution?.photos.filter(p => p.type === 'BEFORE').length || 0),
                afterPhotos: (execution?.photos.filter(p => p.type === 'AFTER').length || 0),
            },
            generatedAt: new Date().toISOString(),
        };

        // Create or update report
        if (!report) {
            report = await prisma.serviceReport.create({
                data: {
                    bookingId,
                    reportData: reportData as any,
                }
            });
        } else {
            report = await prisma.serviceReport.update({
                where: { id: report.id },
                data: {
                    reportData: reportData as any,
                }
            });
        }

        return NextResponse.json({
            report,
            data: reportData
        });

    } catch (error) {
        console.error('[ServiceReport] GET error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate report' 
        }, { status: 500 });
    }
}

/**
 * POST - Send report to customer via email
 */
export async function POST(request: NextRequest, { params }: Props) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;

        // Verify cleaner assigned to this job
        const cleaner = await prisma.cleanerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!cleaner) {
            return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 });
        }

        const booking = await prisma.booking.findFirst({
            where: {
                id: bookingId,
                assignments: {
                    some: { cleanerId: cleaner.id, status: 'ACCEPTED' }
                }
            },
            include: {
                user: true,
                serviceType: true,
                jobExecution: {
                    include: {
                        photos: true,
                        checklist: true
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const execution = booking.jobExecution;
        const customer = booking.user;

        // Generate HTML report
        const beforePhotos = execution?.photos.filter(p => p.type === 'BEFORE') || [];
        const afterPhotos = execution?.photos.filter(p => p.type === 'AFTER') || [];
        const completedTasks = execution?.checklist.filter(c => c.completed) || [];

        const reportHtml = `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h1 style="color: #2563eb; text-align: center;">✨ Service Report</h1>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">${booking.serviceType.name}</h2>
                    <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</p>
                    <p><strong>Duration:</strong> ${execution?.startedAt && execution?.completedAt 
                        ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 60000) + ' minutes'
                        : 'N/A'}</p>
                </div>

                <h3>📋 Completed Tasks (${completedTasks.length}/${execution?.checklist.length || 0})</h3>
                <ul>
                    ${completedTasks.map(task => `<li>✓ ${task.task}</li>`).join('')}
                </ul>

                ${beforePhotos.length > 0 ? `
                    <h3>📷 Before Photos</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        ${beforePhotos.slice(0, 4).map(photo => `
                            <img src="${photo.url}" alt="Before" style="width: 100%; border-radius: 8px;" />
                        `).join('')}
                    </div>
                ` : ''}

                ${afterPhotos.length > 0 ? `
                    <h3>✨ After Photos</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        ${afterPhotos.slice(0, 4).map(photo => `
                            <img src="${photo.url}" alt="After" style="width: 100%; border-radius: 8px;" />
                        `).join('')}
                    </div>
                ` : ''}

                <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px; text-align: center;">
                    <p style="margin: 0;">Thank you for choosing Fixelo!</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}/review" 
                       style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                        Leave a Review
                    </a>
                </div>
            </div>
        `;

        // Send email
        await sendEmailNotification(customer.id, {
            to: customer.email,
            subject: `Service Report - ${booking.serviceType.name} (${new Date(booking.scheduledDate).toLocaleDateString()})`,
            html: reportHtml,
        }, { bookingId, type: 'SERVICE_REPORT' });

        // Update report with email sent info
        await prisma.serviceReport.updateMany({
            where: { bookingId },
            data: {
                emailedAt: new Date(),
                emailedTo: customer.email,
            }
        });

        return NextResponse.json({
            success: true,
            message: `Report sent to ${customer.email}`
        });

    } catch (error) {
        console.error('[ServiceReport] POST error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to send report' 
        }, { status: 500 });
    }
}
