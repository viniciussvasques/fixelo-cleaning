'use client';

import { Badge } from '@/components/ui/badge';
import { DocumentViewer } from './document-viewer';
import { FileText, Shield, User } from 'lucide-react';

interface CleanerDocumentsProps {
    profileImage: string | null;
    idDocumentUrl: string | null;
    photoIdBackUrl: string | null;
    insuranceDocUrl: string | null;
    photoIdType: string | null;
    backgroundCheckStatus: string | null;
}

export function CleanerDocumentsViewer({
    profileImage,
    idDocumentUrl,
    photoIdBackUrl,
    insuranceDocUrl,
    photoIdType,
    backgroundCheckStatus,
}: CleanerDocumentsProps) {
    return (
        <div className="space-y-4">
            {/* Profile Photo */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Profile Photo</p>
                        <p className="text-xs text-muted-foreground">Cleaner&apos;s face photo</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {profileImage ? (
                        <>
                            <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
                            <DocumentViewer url={profileImage} label="Profile Photo" type="image" />
                        </>
                    ) : (
                        <Badge variant="outline">Missing</Badge>
                    )}
                </div>
            </div>

            {/* Photo ID Front */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Photo ID - Front</p>
                        <p className="text-xs text-muted-foreground">{photoIdType || 'Not specified'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {idDocumentUrl ? (
                        <>
                            <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
                            <DocumentViewer url={idDocumentUrl} label="Photo ID - Front" type="image" />
                        </>
                    ) : (
                        <Badge variant="outline">Missing</Badge>
                    )}
                </div>
            </div>

            {/* Photo ID Back */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Photo ID - Back</p>
                        <p className="text-xs text-muted-foreground">Reverse side of ID</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {photoIdBackUrl ? (
                        <>
                            <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
                            <DocumentViewer url={photoIdBackUrl} label="Photo ID - Back" type="image" />
                        </>
                    ) : (
                        <Badge variant="outline">Missing</Badge>
                    )}
                </div>
            </div>

            {/* Insurance */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Insurance</p>
                        <p className="text-xs text-muted-foreground">Liability coverage</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {insuranceDocUrl ? (
                        <>
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            <DocumentViewer url={insuranceDocUrl} label="Insurance Document" type="pdf" />
                        </>
                    ) : (
                        <Badge variant="outline">Not provided</Badge>
                    )}
                </div>
            </div>

            {/* Background Check */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="font-medium">Background Check</p>
                        <p className="text-xs text-muted-foreground">Criminal history</p>
                    </div>
                </div>
                <Badge variant="outline">{backgroundCheckStatus || 'Not run'}</Badge>
            </div>
        </div>
    );
}
