/**
 * Test S3 Connection
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { getS3Client, testS3Connection } from '@/lib/s3';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await testS3Connection();

        return NextResponse.json({
            success: result.success,
            message: result.message,
            bucket: result.bucket,
        });

    } catch (error) {
        console.error('[StorageTest] error:', error);
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed',
        }, { status: 500 });
    }
}
