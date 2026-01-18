/**
 * Admin Document Viewer API
 * 
 * Returns presigned URLs for viewing private S3 documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { getPresignedDownloadUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
        }

        // Extract S3 key from URL
        // URL format: https://bucket.s3.region.amazonaws.com/key
        const urlObj = new URL(url);
        const key = urlObj.pathname.slice(1); // Remove leading /

        if (!key) {
            return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 });
        }

        // Generate presigned URL (valid for 1 hour)
        const presignedUrl = await getPresignedDownloadUrl(key, 3600);

        return NextResponse.json({ presignedUrl });
    } catch (error) {
        console.error('[Admin Documents] Error generating presigned URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate document URL' },
            { status: 500 }
        );
    }
}
