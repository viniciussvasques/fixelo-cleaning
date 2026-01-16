/**
 * File Upload API
 * 
 * Handles secure file uploads to S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToS3, UPLOAD_FOLDERS, getPresignedUploadUrl } from '@/lib/s3';
import { prisma } from '@fixelo/database';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
];

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string | null;
        const bookingId = formData.get('bookingId') as string | null;
        const photoType = formData.get('photoType') as string | null; // 'BEFORE' or 'AFTER'
        const room = formData.get('room') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC, PDF'
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: 'File too large. Maximum size is 10MB'
            }, { status: 400 });
        }

        // Build S3 key
        const timestamp = Date.now();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        let s3Key: string;

        if (folder === 'job-photos' && bookingId) {
            const subfolder = photoType === 'AFTER' ? UPLOAD_FOLDERS.JOB_PHOTOS_AFTER : UPLOAD_FOLDERS.JOB_PHOTOS_BEFORE;
            s3Key = `${subfolder}/${bookingId}/${timestamp}.${ext}`;
        } else if (folder === 'documents') {
            s3Key = `${UPLOAD_FOLDERS.CLEANER_DOCUMENTS}/${session.user.id}/${timestamp}.${ext}`;
        } else if (folder === 'profile') {
            s3Key = `${UPLOAD_FOLDERS.PROFILE_PHOTOS}/${session.user.id}/${timestamp}.${ext}`;
        } else if (folder === 'support') {
            s3Key = `${UPLOAD_FOLDERS.SUPPORT_ATTACHMENTS}/${session.user.id}/${timestamp}.${ext}`;
        } else {
            s3Key = `uploads/${session.user.id}/${timestamp}.${ext}`;
        }

        // Upload to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, key } = await uploadToS3(buffer, s3Key, file.type);

        // If it's a job photo, save to database
        if (folder === 'job-photos' && bookingId && photoType) {
            // Resolve the ID: might be assignmentId or bookingId
            let resolvedBookingId = bookingId;

            // Check if it's an assignment ID first
            const assignment = await prisma.cleanerAssignment.findUnique({
                where: { id: bookingId },
                select: { bookingId: true }
            });

            if (assignment) {
                resolvedBookingId = assignment.bookingId;
            }

            // Get or create job execution
            let jobExecution = await prisma.jobExecution.findUnique({
                where: { bookingId: resolvedBookingId }
            });

            if (!jobExecution) {
                // Get cleaner profile
                const cleaner = await prisma.cleanerProfile.findUnique({
                    where: { userId: session.user.id }
                });

                if (cleaner) {
                    jobExecution = await prisma.jobExecution.create({
                        data: {
                            bookingId: resolvedBookingId,
                            cleanerId: cleaner.id,
                            status: 'NOT_STARTED'
                        }
                    });
                }
            }

            if (jobExecution) {
                await prisma.jobPhoto.create({
                    data: {
                        jobExecutionId: jobExecution.id,
                        type: photoType as 'BEFORE' | 'AFTER',
                        url,
                        s3Key: key,
                        room: room || undefined,
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            url,
            key,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Upload failed'
        }, { status: 500 });
    }
}

/**
 * Get presigned URL for direct browser upload
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || 'uploads';
        const contentType = searchParams.get('contentType') || 'image/jpeg';
        const bookingId = searchParams.get('bookingId');

        const timestamp = Date.now();
        const ext = contentType.split('/')[1] || 'jpg';

        let key: string;
        if (bookingId) {
            key = `${folder}/${bookingId}/${timestamp}.${ext}`;
        } else {
            key = `${folder}/${session.user.id}/${timestamp}.${ext}`;
        }

        const presignedUrl = await getPresignedUploadUrl(key, contentType);

        return NextResponse.json({
            presignedUrl,
            key,
            expiresIn: 3600
        });

    } catch (error) {
        console.error('[Upload] Presigned URL error:', error);
        return NextResponse.json({
            error: 'Failed to generate upload URL'
        }, { status: 500 });
    }
}
