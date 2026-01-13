/**
 * Storage Settings API (Admin only)
 * 
 * Configure S3 credentials and bucket settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { clearS3ConfigCache } from '@/lib/s3';

const storageSettingsSchema = z.object({
    s3_region: z.string().min(1, 'Region is required'),
    s3_access_key: z.string().min(1, 'Access Key is required'),
    s3_secret_key: z.string().min(1, 'Secret Key is required'),
    s3_bucket: z.string().min(1, 'Bucket name is required'),
});

/**
 * GET - Get storage settings (keys masked)
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['s3_region', 's3_access_key', 's3_secret_key', 's3_bucket'] }
            },
            select: { key: true, value: true }
        });

        const settings: Record<string, string> = {
            s3_region: '',
            s3_access_key: '',
            s3_secret_key: '',
            s3_bucket: '',
        };

        configs.forEach(config => {
            if (config.key === 's3_secret_key' && config.value) {
                // Mask secret key
                settings[config.key] = '••••••••' + config.value.slice(-4);
            } else if (config.key === 's3_access_key' && config.value) {
                // Show last 4 chars
                settings[config.key] = '••••••••' + config.value.slice(-4);
            } else {
                settings[config.key] = config.value || '';
            }
        });

        return NextResponse.json(settings);

    } catch (error) {
        console.error('[StorageSettings] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * POST - Update storage settings
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = storageSettingsSchema.parse(body);

        // Update each setting
        for (const [key, value] of Object.entries(validatedData)) {
            // Skip masked values (don't update if user didn't change)
            if (value.includes('••••')) continue;

            await prisma.systemConfig.upsert({
                where: { key },
                update: { value },
                create: { key, value, description: `S3 ${key.replace('s3_', '')}` }
            });
        }

        // Clear cached S3 config
        clearS3ConfigCache();

        return NextResponse.json({
            success: true,
            message: 'Storage settings updated successfully'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Validation error', 
                details: error.issues 
            }, { status: 400 });
        }
        console.error('[StorageSettings] POST error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
