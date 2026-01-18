'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentViewer } from './document-viewer';
import { FileText, Shield, User, Send, Loader2, CheckCircle } from 'lucide-react';

interface CleanerDocumentsProps {
    cleanerId: string;
    cleanerName: string;
    cleanerEmail: string;
    profileImage: string | null;
    idDocumentUrl: string | null;
    photoIdBackUrl: string | null;
    insuranceDocUrl: string | null;
    photoIdType: string | null;
    backgroundCheckStatus: string | null;
    onboardingStep: number;
    onboardingCompleted: boolean;
}

type DocumentType = 'PROFILE_PHOTO' | 'ID_FRONT' | 'ID_BACK' | 'INSURANCE';

const documentLabels: Record<DocumentType, string> = {
    PROFILE_PHOTO: 'Profile Photo',
    ID_FRONT: 'Photo ID - Front',
    ID_BACK: 'Photo ID - Back',
    INSURANCE: 'Insurance Document',
};

export function CleanerDocumentsViewerEnhanced({
    cleanerId,
    cleanerName,
    cleanerEmail,
    profileImage,
    idDocumentUrl,
    photoIdBackUrl,
    insuranceDocUrl,
    photoIdType,
    backgroundCheckStatus,
    onboardingStep,
    onboardingCompleted,
}: CleanerDocumentsProps) {
    const [sendingDoc, setSendingDoc] = useState<DocumentType | null>(null);
    const [sentDocs, setSentDocs] = useState<Set<DocumentType>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const requestDocumentResubmission = async (docType: DocumentType) => {
        setSendingDoc(docType);
        setError(null);

        try {
            const response = await fetch('/api/admin/request-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cleanerId,
                    cleanerEmail,
                    cleanerName,
                    documentType: docType,
                    documentLabel: documentLabels[docType],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send request');
            }

            setSentDocs(prev => new Set([...prev, docType]));
        } catch (err) {
            setError(`Failed to request ${documentLabels[docType]}`);
        } finally {
            setSendingDoc(null);
        }
    };

    const renderDocumentRow = (
        url: string | null,
        docType: DocumentType,
        icon: React.ReactNode,
        description: string
    ) => {
        const isSent = sentDocs.has(docType);
        const isSending = sendingDoc === docType;

        return (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <p className="font-medium">{documentLabels[docType]}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {url ? (
                        <>
                            <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
                            <DocumentViewer
                                url={url}
                                label={documentLabels[docType]}
                                type={docType === 'INSURANCE' ? 'pdf' : 'image'}
                            />
                        </>
                    ) : (
                        <>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">Missing</Badge>
                            {isSent ? (
                                <Badge className="bg-blue-100 text-blue-800 gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Requested
                                </Badge>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requestDocumentResubmission(docType)}
                                    disabled={isSending}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Send className="w-3 h-3" />
                                    )}
                                    Request
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Onboarding Status */}
            {!onboardingCompleted && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-amber-800 font-medium text-sm">
                            ⚠️ Onboarding Incomplete
                        </span>
                        <Badge className="bg-amber-100 text-amber-800">
                            Step {onboardingStep} / 5
                        </Badge>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {renderDocumentRow(
                profileImage,
                'PROFILE_PHOTO',
                <User className="w-5 h-5 text-slate-400" />,
                "Cleaner's face photo"
            )}

            {renderDocumentRow(
                idDocumentUrl,
                'ID_FRONT',
                <FileText className="w-5 h-5 text-slate-400" />,
                photoIdType || 'Government-issued ID'
            )}

            {renderDocumentRow(
                photoIdBackUrl,
                'ID_BACK',
                <FileText className="w-5 h-5 text-slate-400" />,
                'Reverse side of ID'
            )}

            {renderDocumentRow(
                insuranceDocUrl,
                'INSURANCE',
                <Shield className="w-5 h-5 text-slate-400" />,
                'Liability coverage document'
            )}

            {/* Background Check */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Background Check</p>
                        <p className="text-xs text-muted-foreground">Criminal history verification</p>
                    </div>
                </div>
                <Badge variant="outline">{backgroundCheckStatus || 'Not run'}</Badge>
            </div>
        </div>
    );
}
