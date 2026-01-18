import { prisma } from "@fixelo/database";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CleanerStatus } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft, CheckCircle, XCircle, Phone, Mail, Globe,
    Linkedin, Instagram, FileText, Shield, User, Calendar
} from "lucide-react";
import { revalidatePath } from "next/cache";
import { sendEmailNotification } from "@/lib/email";
import { sendSMSNotification } from "@/lib/sms";
import { CleanerDocumentsViewerEnhanced } from "@/components/admin/cleaner-documents-viewer";
import { EmailHistory } from "@/components/admin/email-history";


async function approveCleaner(id: string) {
    'use server';
    const cleaner = await prisma.cleanerProfile.update({
        where: { id },
        data: {
            status: CleanerStatus.ACTIVE,
            verificationStatus: 'APPROVED',
            reviewedAt: new Date(),
        },
        include: {
            user: true,
        }
    });

    // Send approval email
    await sendEmailNotification(cleaner.userId, {
        to: cleaner.user.email,
        subject: '🎉 Welcome to Fixelo! Your Application is Approved',
        html: `
            <h1>Congratulations, ${cleaner.user.firstName}!</h1>
            <p>Your application to join the Fixelo cleaning team has been <strong>approved</strong>!</p>
            <p>You can now:</p>
            <ul>
                <li>✅ Set up your availability</li>
                <li>✅ Start receiving job offers</li>
                <li>✅ Connect your bank account for payouts</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/cleaner/dashboard">Go to your dashboard</a></p>
            <p>Welcome aboard!<br/>The Fixelo Team</p>
        `,
    });

    // Send approval SMS if phone available
    if (cleaner.user.phone) {
        await sendSMSNotification(
            cleaner.userId,
            cleaner.user.phone,
            `🎉 ${cleaner.user.firstName}, you're approved! Welcome to Fixelo. Log in to start accepting jobs: ${process.env.NEXT_PUBLIC_APP_URL}/cleaner/dashboard`
        );
    }

    revalidatePath('/admin/users/cleaner');
    redirect('/admin/users/cleaner');
}

async function rejectCleaner(id: string, reason: string) {
    'use server';
    const cleaner = await prisma.cleanerProfile.update({
        where: { id },
        data: {
            status: CleanerStatus.SUSPENDED,
            verificationStatus: 'REJECTED',
            rejectionReason: reason,
            reviewedAt: new Date(),
        },
        include: {
            user: true,
        }
    });

    // Send rejection email
    await sendEmailNotification(cleaner.userId, {
        to: cleaner.user.email,
        subject: 'Fixelo Application Update',
        html: `
            <h1>Hello ${cleaner.user.firstName},</h1>
            <p>Thank you for your interest in joining the Fixelo cleaning team.</p>
            <p>After reviewing your application, we're unable to proceed at this time.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you believe this is an error or have additional documents to submit, please contact us at support@fixelo.app.</p>
            <p>Best regards,<br/>The Fixelo Team</p>
        `,
    });

    revalidatePath('/admin/users/cleaner');
    redirect('/admin/users/cleaner');
}

async function markReferenceContacted(refId: string) {
    'use server';
    await prisma.cleanerReference.update({
        where: { id: refId },
        data: { contacted: true, contactedAt: new Date() }
    });
    revalidatePath('/admin/users/cleaner');
}

async function markReferenceVerified(refId: string) {
    'use server';
    await prisma.cleanerReference.update({
        where: { id: refId },
        data: { verified: true }
    });
    revalidatePath('/admin/users/cleaner');
}

async function requestDocumentResubmission(id: string, reason: string, documentsNeeded: string[]) {
    'use server';
    const cleaner = await prisma.cleanerProfile.update({
        where: { id },
        data: {
            verificationStatus: 'DOCUMENTS_NEEDED',
            documentRequestReason: reason,
            documentRequestedAt: new Date(),
            documentsRequested: JSON.stringify(documentsNeeded), // Store as JSON array
        },
        include: {
            user: true,
        }
    });

    // Send email notification
    await sendEmailNotification(cleaner.userId, {
        to: cleaner.user.email,
        subject: '📄 Action Required: Document Resubmission Needed',
        html: `
            <h1>Hello ${cleaner.user.firstName},</h1>
            <p>We've reviewed your application and need you to resubmit some documents.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Documents needed:</strong></p>
            <ul>
                ${documentsNeeded.map(doc => `<li>${doc.replace('_', ' ')}</li>`).join('')}
            </ul>
            <p>Please log in to your dashboard to upload the requested documents:</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding/cleaner" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upload Documents</a></p>
            <p>Thank you for your cooperation.</p>
            <p>Best regards,<br/>The Fixelo Team</p>
        `,
    });

    // Send SMS notification
    if (cleaner.user.phone) {
        await sendSMSNotification(
            cleaner.userId,
            cleaner.user.phone,
            `Fixelo: We need you to resubmit some documents. Check your email (${cleaner.user.email}) for details.`
        );
    }

    revalidatePath(`/admin/users/cleaner/${id}`);
}

async function requestReEvaluation(id: string) {
    'use server';
    const cleaner = await prisma.cleanerProfile.update({
        where: { id },
        data: {
            verificationStatus: 'UNDER_REVIEW',
        },
        include: {
            user: true,
        }
    });

    // Send notification email
    await sendEmailNotification(cleaner.userId, {
        to: cleaner.user.email,
        subject: '📋 Account Review in Progress',
        html: `
            <h1>Hello ${cleaner.user.firstName},</h1>
            <p>We are conducting a periodic review of your Fixelo Pro account.</p>
            <p>As part of this review, we may request updated documents or information. Please ensure your profile and documents are up to date.</p>
            <p>If we need any additional information, we'll contact you.</p>
            <p>You can continue to use your account normally during this review.</p>
            <p>Best regards,<br/>The Fixelo Team</p>
        `,
    }, { type: 'RE_EVALUATION' });

    revalidatePath(`/admin/users/cleaner/${id}`);
}

export default async function CleanerReviewPage({ params }: { params: { id: string } }) {
    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { id: params.id },
        include: {
            user: true,
            references: true,
        }
    });

    if (!cleaner) {
        notFound();
    }

    const approveAction = approveCleaner.bind(null, cleaner.id);
    const rejectAction = rejectCleaner.bind(null, cleaner.id, 'Application did not meet requirements');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users/cleaner" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Review: {cleaner.user.firstName} {cleaner.user.lastName}</h1>
                        <p className="text-muted-foreground">{cleaner.user.email}</p>
                    </div>
                </div>

                {cleaner.verificationStatus !== 'APPROVED' && cleaner.verificationStatus !== 'REJECTED' && (
                    <div className="flex gap-3">
                        <form action={async () => {
                            'use server';
                            await requestDocumentResubmission(
                                cleaner.id,
                                'Document image quality is insufficient or document has expired',
                                ['PHOTO_ID']
                            );
                        }}>
                            <Button variant="outline" type="submit" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                <FileText className="w-4 h-4 mr-2" />
                                Request Resubmission
                            </Button>
                        </form>
                        <form action={rejectAction}>
                            <Button variant="outline" type="submit" className="border-red-200 text-red-600 hover:bg-red-50">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </form>
                        <form action={approveAction}>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </form>
                    </div>
                )}
            </div>

            {/* Status Banner */}
            {cleaner.verificationStatus === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Application Approved</span>
                    {cleaner.reviewedAt && (
                        <span className="text-green-600 text-sm">
                            on {format(new Date(cleaner.reviewedAt), 'MMM d, yyyy')}
                        </span>
                    )}
                    <form action={requestReEvaluation.bind(null, cleaner.id)} className="ml-auto">
                        <Button variant="outline" type="submit" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                            <Shield className="w-4 h-4 mr-1" />
                            Request Re-Evaluation
                        </Button>
                    </form>
                </div>
            )}

            {cleaner.verificationStatus === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">Application Rejected</span>
                    </div>
                    {cleaner.rejectionReason && (
                        <p className="text-red-700 text-sm mt-2">Reason: {cleaner.rejectionReason}</p>
                    )}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information

 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Full Name</span>
                                <p className="font-medium">{cleaner.user.firstName} {cleaner.user.lastName}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Phone</span>
                                <p className="font-medium flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {cleaner.user.phone || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Email</span>
                            <p className="font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {cleaner.user.email}
                            </p>
                        </div>

                        {/* Business Type */}
                        <div>
                            <span className="text-sm text-muted-foreground">Business Type</span>
                            <p className="font-medium">
                                {cleaner.businessType === 'COMPANY' ? '🏢 Company' : '👤 Individual'}
                            </p>
                        </div>

                        {/* Tax ID */}
                        <div>
                            <span className="text-sm text-muted-foreground">Tax ID ({cleaner.taxIdType || 'SSN'})</span>
                            <p className="font-medium">
                                {cleaner.taxIdType === 'EIN' && cleaner.ein
                                    ? `EIN: ••-•••${cleaner.ein.slice(-4)}`
                                    : cleaner.taxIdType === 'ITIN' && cleaner.itin
                                        ? `ITIN: ••••${cleaner.itin}`
                                        : cleaner.ssnLast4
                                            ? `SSN: ••••${cleaner.ssnLast4}`
                                            : 'N/A'
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Verification Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CleanerDocumentsViewerEnhanced
                            cleanerId={cleaner.id}
                            cleanerName={cleaner.user.firstName}
                            cleanerEmail={cleaner.user.email}
                            profileImage={cleaner.profileImage}
                            idDocumentUrl={cleaner.idDocumentUrl}
                            photoIdBackUrl={cleaner.photoIdBackUrl}
                            insuranceDocUrl={cleaner.insuranceDocUrl}
                            photoIdType={cleaner.photoIdType}
                            backgroundCheckStatus={cleaner.backgroundCheckStatus}
                            onboardingStep={cleaner.onboardingStep}
                            onboardingCompleted={cleaner.onboardingCompleted}
                        />
                    </CardContent>
                </Card>

                {/* Social Profiles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Social Profiles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {cleaner.linkedinProfile && (
                            <a href={cleaner.linkedinProfile} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <Linkedin className="w-5 h-5 text-blue-700" />
                                <span className="text-blue-700 font-medium">LinkedIn Profile</span>
                            </a>
                        )}
                        {cleaner.instagramHandle && (
                            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                                <Instagram className="w-5 h-5 text-pink-600" />
                                <span className="text-pink-700 font-medium">@{cleaner.instagramHandle}</span>
                            </div>
                        )}
                        {cleaner.websiteUrl && (
                            <a href={cleaner.websiteUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <Globe className="w-5 h-5 text-green-600" />
                                <span className="text-green-700 font-medium">Website</span>
                            </a>
                        )}
                        {!cleaner.linkedinProfile && !cleaner.instagramHandle && !cleaner.websiteUrl && (
                            <p className="text-muted-foreground text-center py-4">No social profiles provided</p>
                        )}
                    </CardContent>
                </Card>

                {/* Professional References */}
                <Card>
                    <CardHeader>
                        <CardTitle>Professional References ({cleaner.references.length})</CardTitle>
                        <CardDescription>Contact and verify each reference</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cleaner.references.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No references provided</p>
                        ) : (
                            cleaner.references.map((ref) => (
                                <div key={ref.id} className={`p-4 rounded-lg border ${ref.verified ? 'bg-green-50 border-green-200' : 'bg-slate-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{ref.name}</p>
                                            <p className="text-sm text-muted-foreground">{ref.relationship}</p>
                                            <p className="text-sm flex items-center gap-1 mt-1">
                                                <Phone className="w-3 h-3" />
                                                {ref.phone}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {ref.verified ? (
                                                <Badge className="bg-green-600">Verified</Badge>
                                            ) : ref.contacted ? (
                                                <form action={markReferenceVerified.bind(null, ref.id)}>
                                                    <Button size="sm" type="submit" className="bg-green-600 hover:bg-green-700">
                                                        Mark Verified
                                                    </Button>
                                                </form>
                                            ) : (
                                                <form action={markReferenceContacted.bind(null, ref.id)}>
                                                    <Button size="sm" variant="outline" type="submit">
                                                        Mark Contacted
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Submission Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p className="font-medium">
                                {cleaner.submittedAt ? format(new Date(cleaner.submittedAt), 'MMM d, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Reviewed</p>
                            <p className="font-medium">
                                {cleaner.reviewedAt ? format(new Date(cleaner.reviewedAt), 'MMM d, yyyy') : 'Pending'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Email History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email History
                    </CardTitle>
                    <CardDescription>All emails sent to this cleaner</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmailHistory cleanerId={cleaner.id} />
                </CardContent>
            </Card>
        </div>
    );
}
