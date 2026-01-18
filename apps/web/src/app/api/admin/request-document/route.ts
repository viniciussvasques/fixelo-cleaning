/**
 * Admin Request Document API
 * 
 * Sends email to cleaner requesting specific document resubmission
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { sendEmailNotification } from '@/lib/email';
import { prisma } from '@fixelo/database';

const documentDescriptions: Record<string, { title: string; description: string }> = {
    PROFILE_PHOTO: {
        title: 'Profile Photo',
        description: 'A clear, recent photo of your face for identification purposes.',
    },
    ID_FRONT: {
        title: 'Government ID - Front',
        description: 'The front side of your driver\'s license, passport, or state ID.',
    },
    ID_BACK: {
        title: 'Government ID - Back',
        description: 'The back side of your driver\'s license or state ID.',
    },
    INSURANCE: {
        title: 'Insurance Document',
        description: 'Your liability insurance certificate or proof of coverage.',
    },
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { cleanerId, cleanerEmail, cleanerName, documentType, documentLabel } = body;

        if (!cleanerId || !cleanerEmail || !documentType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const docInfo = documentDescriptions[documentType] || {
            title: documentLabel || 'Required Document',
            description: 'Please upload this document to continue with your verification.',
        };

        // Send specific document request email
        await sendEmailNotification(cleanerId, {
            to: cleanerEmail,
            subject: `📋 Action Required: Please Resubmit Your ${docInfo.title}`,
            html: `
                <h1>Hello ${cleanerName}!</h1>
                <p>We need you to resubmit the following document to complete your Fixelo Pro verification:</p>
                
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px 0; color: #374151;">${docInfo.title}</h3>
                    <p style="margin: 0; color: #6b7280;">${docInfo.description}</p>
                </div>
                
                <p><strong>Why was this requested?</strong></p>
                <ul>
                    <li>The previous document may have been unclear or incomplete</li>
                    <li>We need additional verification</li>
                </ul>
                
                <p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding/cleaner" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Upload Document Now
                    </a>
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    If you have questions, contact us at support@fixelo.app
                </p>
                
                <p>Best regards,<br/>The Fixelo Team</p>
            `,
        });

        // Update cleaner profile to track document request
        await prisma.cleanerProfile.update({
            where: { id: cleanerId },
            data: {
                verificationStatus: 'DOCUMENTS_NEEDED',
            },
        });

        return NextResponse.json({ success: true, message: 'Document request sent' });
    } catch (error) {
        console.error('[Admin Request Document] Error:', error);
        return NextResponse.json(
            { error: 'Failed to send document request' },
            { status: 500 }
        );
    }
}
