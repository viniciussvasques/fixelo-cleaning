/**
 * AWS S3 Upload Service
 * 
 * Handles file uploads for:
 * - Cleaner documents (ID, insurance)
 * - Job photos (before/after)
 * - Profile photos
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@fixelo/database';

interface S3Config {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
}

let cachedS3Config: S3Config | null = null;
let cachedS3Client: S3Client | null = null;

/**
 * Get S3 configuration from database or environment
 */
async function getS3Config(): Promise<S3Config> {
    if (cachedS3Config) return cachedS3Config;

    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['s3_region', 's3_access_key', 's3_secret_key', 's3_bucket'] }
            },
            select: { key: true, value: true }
        });

        const configMap = new Map(configs.map(c => [c.key, c.value]));

        cachedS3Config = {
            region: configMap.get('s3_region') || process.env.AWS_REGION || 'us-east-1',
            accessKeyId: configMap.get('s3_access_key') || process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: configMap.get('s3_secret_key') || process.env.AWS_SECRET_ACCESS_KEY || '',
            bucketName: configMap.get('s3_bucket') || process.env.AWS_S3_BUCKET || 'fixelo-uploads',
        };

        return cachedS3Config;
    } catch (error) {
        console.error('[S3] Error fetching config:', error);

        // Fallback to environment variables
        cachedS3Config = {
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            bucketName: process.env.AWS_S3_BUCKET || 'fixelo-uploads',
        };

        return cachedS3Config;
    }
}

/**
 * Get or create S3 client
 */
export async function getS3Client(): Promise<S3Client> {
    if (cachedS3Client) return cachedS3Client;

    const config = await getS3Config();

    cachedS3Client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    return cachedS3Client;
}

/**
 * Clear S3 config cache (call after updating config in admin)
 */
export function clearS3ConfigCache(): void {
    cachedS3Config = null;
    cachedS3Client = null;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string
): Promise<{ url: string; key: string }> {
    const s3 = await getS3Client();
    const config = await getS3Config();

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make uploaded files publicly accessible
    });

    await s3.send(command);

    const url = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;

    return { url, key };
}

/**
 * Upload file from FormData/File
 */
export async function uploadFileToS3(
    file: File,
    folder: string,
    userId: string
): Promise<{ url: string; key: string }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const key = `${folder}/${userId}/${timestamp}.${ext}`;

    return uploadToS3(buffer, key, file.type);
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
    const s3 = await getS3Client();
    const config = await getS3Config();

    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    await s3.send(command);
}

/**
 * Generate presigned URL for direct upload (client-side upload)
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const s3 = await getS3Client();
    const config = await getS3Config();

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generate presigned URL for download (private files)
 */
export async function getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const s3 = await getS3Client();
    const config = await getS3Config();

    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Upload types for organized folder structure
 */
export const UPLOAD_FOLDERS = {
    CLEANER_DOCUMENTS: 'cleaners/documents',
    CLEANER_PHOTOS: 'cleaners/photos',
    JOB_PHOTOS_BEFORE: 'jobs/before',
    JOB_PHOTOS_AFTER: 'jobs/after',
    PROFILE_PHOTOS: 'profiles',
    SUPPORT_ATTACHMENTS: 'support',
} as const;

/**
 * Test S3 connection
 */
export async function testS3Connection(): Promise<{ success: boolean; message: string; bucket?: string }> {
    try {
        const config = await getS3Config();

        if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
            return {
                success: false,
                message: 'S3 credentials not fully configured',
            };
        }

        const s3 = await getS3Client();

        // Try to list objects (limited to 1) to test connection
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName,
            MaxKeys: 1,
        });

        await s3.send(command);

        return {
            success: true,
            message: 'Successfully connected to S3',
            bucket: config.bucketName,
        };
    } catch (error) {
        console.error('[S3] Connection test failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed',
        };
    }
}
