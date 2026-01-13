/**
 * Job Completion API
 * 
 * Called when a cleaner marks a job as complete.
 * Triggers the payout process.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { processJobCompletion } from '@/lib/stripe-connect';
import { sendEmailNotification } from '@/lib/email';
import { sendSMSNotification, SMS_TEMPLATES } from '@/lib/sms';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const bookingId = params.id;

        // Verify the cleaner is assigned to this booking
        const cleaner = await prisma.cleanerProfile.findFirst({
            where: { userId: session.user.id },
        });

        if (!cleaner) {
            return NextResponse.json(
                { error: { code: 'CLEANER_NOT_FOUND', message: 'Cleaner profile not found' } },
                { status: 404 }
            );
        }

        const assignment = await prisma.cleanerAssignment.findFirst({
            where: {
                bookingId,
                cleanerId: cleaner.id,
                status: 'ACCEPTED',
            },
        });

        if (!assignment) {
            return NextResponse.json(
                { error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this job' } },
                { status: 403 }
            );
        }

        // Get optional completion data
        const body = await request.json().catch(() => ({}));

        // Update booking to COMPLETED
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'COMPLETED' },
        });

        // Update cleaner metrics
        await prisma.cleanerProfile.update({
            where: { id: cleaner.id },
            data: {
                totalJobsCompleted: { increment: 1 },
            },
        });

        // Process payout
        const payoutResult = await processJobCompletion(bookingId);

        if (!payoutResult.success) {
            console.error(`[JobComplete] Payout failed for booking ${bookingId}:`, payoutResult.error);
            // Don't fail the request - job is complete, payout can be retried
        }

        // Send notifications
        try {
            const booking = await prisma.booking.findUnique({
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

            if (booking?.user) {
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
                console.log(`✅ Job completion email sent to ${customer.email}`);

                // SMS to customer
                if (customer.phone) {
                    await sendSMSNotification(
                        customer.id,
                        customer.phone,
                        `Your Fixelo cleaning is complete! ✨ Hope it looks great. Leave a review: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                        { bookingId, type: 'JOB_COMPLETED' }
                    );
                }
            }

            // SMS to cleaner about payment
            if (cleanerWithUser?.user.phone && payoutResult.success) {
                const payoutAmount = booking?.totalPrice ? booking.totalPrice * 0.85 : 0;
                await sendSMSNotification(
                    cleanerWithUser.userId,
                    cleanerWithUser.user.phone,
                    SMS_TEMPLATES.paymentReceived(cleanerWithUser.user.firstName || 'Pro', payoutAmount),
                    { bookingId, type: 'PAYOUT_PROCESSED' }
                );
                console.log(`✅ Payment SMS sent to cleaner`);
            }
        } catch (notifError) {
            console.error('❌ Error sending completion notifications:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Job marked as complete',
            payout: payoutResult.success ? {
                status: 'completed',
                transferId: payoutResult.transferId,
            } : {
                status: 'pending',
                error: payoutResult.error,
            },
        });
    } catch (error) {
        console.error('[JobComplete] Error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to complete job' } },
            { status: 500 }
        );
    }
}
