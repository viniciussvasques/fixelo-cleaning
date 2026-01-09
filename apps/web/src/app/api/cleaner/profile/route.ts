import { NextResponse } from 'next/server';
import { prisma } from '@fixelo/database';
import { z } from 'zod';

// Schema for onboarding data
const onboardingSchema = z.object({
    serviceRadius: z.number().min(1).max(100),
    availability: z.array(z.object({
        dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
        startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
        endTime: z.string().regex(/^\d{2}:\d{2}$/),   // HH:MM
        isActive: z.boolean()
    })),
    userId: z.string(), // In real app, get from session

    // New Fields
    businessType: z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
    yearsOfExperience: z.number().optional(),
    bio: z.string().optional(),
    websiteUrl: z.string().optional(),
    linkedinProfile: z.string().optional(),
    instagramHandle: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = onboardingSchema.parse(body);

        // Check if user already has a profile
        const existingProfile = await prisma.cleanerProfile.findUnique({
            where: { userId: data.userId }
        });

        if (existingProfile) {
            // Update existing if pending? Or just return error? 
            // For now, let's allow upsert-like behavior or just error.
            // Returning error as per original logic, but users might retry if failed.
            return new NextResponse("Profile already exists", { status: 400 });
        }

        // Create Profile & Availability
        const cleanerProfile = await prisma.cleanerProfile.create({
            data: {
                userId: data.userId,
                status: 'PENDING_APPROVAL', // Default status
                serviceRadius: data.serviceRadius,

                // New Fields
                businessType: data.businessType,
                yearsOfExperience: data.yearsOfExperience || 0,
                bio: data.bio,
                websiteUrl: data.websiteUrl,
                linkedinProfile: data.linkedinProfile,
                instagramHandle: data.instagramHandle,

                // Create availability records
                availability: {
                    create: data.availability.map(slot => ({
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isActive: slot.isActive
                    }))
                }
            }
        });

        // Update User role to CLEANER (if not already)
        await prisma.user.update({
            where: { id: data.userId },
            data: { role: 'CLEANER' }
        });

        return NextResponse.json(cleanerProfile);

    } catch (error) {
        console.error('Cleaner onboarding error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
