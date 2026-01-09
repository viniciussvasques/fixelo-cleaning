import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';

export async function GET() {
    try {
        const addOns = await prisma.addOn.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                timeAdded: true,
            },
            orderBy: { price: 'asc' },
        });

        return NextResponse.json({ addOns });
    } catch (error) {
        console.error('Error fetching add-ons:', error);
        return NextResponse.json(
            { error: 'Failed to fetch add-ons' },
            { status: 500 }
        );
    }
}
