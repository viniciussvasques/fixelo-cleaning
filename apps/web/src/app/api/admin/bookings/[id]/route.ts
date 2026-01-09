import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                },
                serviceType: {
                    select: { name: true }
                },
                address: {
                    select: {
                        street: true,
                        city: true,
                        state: true,
                        zipCode: true,
                    }
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        stripePaymentIntentId: true,
                    }
                },
                assignments: {
                    include: {
                        cleaner: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error('Get booking error:', error);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
