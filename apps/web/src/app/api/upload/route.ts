/**
 * Image Upload API
 * 
 * Handles file uploads for cleaner profiles, documents, and job photos.
 * Uses Vercel Blob storage in production, local filesystem in development.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const category = formData.get('category') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Max size: 5MB' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${session.user.id}/${category || 'upload'}/${Date.now()}.${ext}`;

        // For production, use Vercel Blob or S3
        // For development/demo, we'll create a data URL
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // In production, you would:
        // const blob = await put(filename, file, { access: 'public' });
        // return NextResponse.json({ success: true, url: blob.url });

        // For now, store reference in database or return data URL
        console.log(`[Upload] File uploaded: ${filename}, size: ${file.size}`);

        return NextResponse.json({
            success: true,
            url: dataUrl, // In production, this would be a CDN URL
            filename,
            size: file.size,
        });
    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

/**
 * Get upload URL for large files (pre-signed URL pattern)
 */
export async function GET(request: Request): Promise<Response> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const contentType = searchParams.get('contentType');

    if (!filename || !contentType) {
        return NextResponse.json(
            { error: 'filename and contentType required' },
            { status: 400 }
        );
    }

    // In production, generate pre-signed URL for direct upload
    // For now, return the regular upload endpoint
    return NextResponse.json({
        uploadUrl: '/api/upload',
        method: 'POST',
        fields: {
            filename,
            contentType,
        },
    });
}
