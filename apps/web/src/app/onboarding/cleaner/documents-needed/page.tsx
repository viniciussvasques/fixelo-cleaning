import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, FileCheck } from "lucide-react";

export default async function DocumentsNeededPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/');
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!cleaner) {
        redirect('/');
    }

    // If not in DOCUMENTS_NEEDED status, redirect to appropriate page
    if (cleaner.verificationStatus !== 'DOCUMENTS_NEEDED') {
        if (cleaner.verificationStatus === 'APPROVED') {
            redirect('/cleaner/dashboard');
        } else if (cleaner.onboardingCompleted) {
            redirect('/cleaner/dashboard');
        } else {
            redirect('/onboarding/cleaner');
        }
    }

    const documentsRequested = cleaner.documentsRequested
        ? JSON.parse(cleaner.documentsRequested) as string[]
        : [];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-6 animate-fade-in">
                {/* Alert Banner */}
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-lg font-semibold text-orange-900 mb-2">
                                    Document Resubmission Required
                                </h2>
                                <p className="text-orange-800">
                                    We've reviewed your application and need you to resubmit some documents to continue the verification process.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reason Card */}
                {cleaner.documentRequestReason && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reason for Request</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700">{cleaner.documentRequestReason}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Documents Requested */}
                <Card>
                    <CardHeader>
                        <CardTitle>Documents Needed</CardTitle>
                        <CardDescription>Please upload the following documents</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {documentsRequested.length > 0 ? (
                            documentsRequested.map((doc) => (
                                <div key={doc} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Upload className="w-5 h-5 text-slate-400" />
                                        <span className="font-medium">
                                            {doc === 'PHOTO_ID' && 'Photo ID / Driver License'}
                                            {doc === 'INSURANCE' && 'Insurance Document'}
                                            {doc === 'BACKGROUND' && 'Background Check'}
                                        </span>
                                    </div>
                                    <Button size="sm" asChild>
                                        <a href={`/onboarding/cleaner/${doc === 'PHOTO_ID' ? 'identity' : 'documents'}`}>
                                            Upload
                                        </a>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                No specific documents requested. Please complete your onboarding.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Action Card */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <FileCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
                                <p className="text-blue-800 text-sm mb-4">
                                    After uploading the requested documents, our team will review them within 24-48 hours.
                                    You'll receive an email and SMS notification once the review is complete.
                                </p>
                                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                                    <a href="/onboarding/cleaner">
                                        Go to Onboarding
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Support */}
                <p className="text-center text-sm text-slate-500">
                    Need help? Contact us at{' '}
                    <a href="mailto:support@fixelo.app" className="text-blue-600 hover:underline">
                        support@fixelo.app
                    </a>
                </p>
            </div>
        </div>
    );
}
