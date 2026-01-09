import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findFirst({
            where: {
                id: params.id,
                userId: session.user.id
            },
            include: {
                serviceType: true,
                address: true,
                addOns: {
                    include: {
                        addOn: true
                    }
                },
                assignments: {
                    include: {
                        cleaner: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                review: true
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error('Booking fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch booking' },
            { status: 500 }
        );
    }
}
