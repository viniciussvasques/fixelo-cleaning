import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const preferencesSchema = z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    marketingEmails: z.boolean().default(false),
});

// GET preferences
export async function GET(_request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For now, return defaults - in production, store in UserPreferences table
        const preferences = {
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
        };

        return NextResponse.json(preferences);
    } catch (error) {
        console.error('Preferences fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        );
    }
}

// PATCH preferences
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = preferencesSchema.parse(body);

        // TODO: Store in UserPreferences table
        // For now, just return success
        console.log('Saving preferences for user:', session.user.id, validatedData);

        return NextResponse.json({ success: true, preferences: validatedData });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Preferences update error:', error);
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}
