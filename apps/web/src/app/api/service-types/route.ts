import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const serviceTypes = await prisma.serviceType.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                basePrice: true,
                pricePerBed: true,
                pricePerBath: true,
                pricePerPet: true,
                inclusions: true,
                exclusions: true,
                baseTime: true,
                timePerBed: true,
                timePerBath: true,
            },
            orderBy: { basePrice: 'asc' },
        });

        return NextResponse.json({ serviceTypes });
    } catch (error) {
        console.error('Error fetching service types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch service types' },
            { status: 500 }
        );
    }
}
