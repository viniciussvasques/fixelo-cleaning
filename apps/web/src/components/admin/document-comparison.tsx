'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SplitSquareHorizontal, Loader2, X } from 'lucide-react';

interface DocumentComparisonProps {
    profileImage: string | null;
    idDocumentUrl: string | null;
    cleanerName: string;
}

export function DocumentComparison({ profileImage, idDocumentUrl, cleanerName }: DocumentComparisonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [profilePresignedUrl, setProfilePresignedUrl] = useState<string | null>(null);
    const [idPresignedUrl, setIdPresignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPresignedUrls = async () => {
        setLoading(true);
        setError(null);

        try {
            const promises = [];

            if (profileImage) {
                promises.push(
                    fetch(`/api/admin/documents?url=${encodeURIComponent(profileImage)}`)
                        .then(r => r.json())
                        .then(d => setProfilePresignedUrl(d.presignedUrl))
                );
            }

            if (idDocumentUrl) {
                promises.push(
                    fetch(`/api/admin/documents?url=${encodeURIComponent(idDocumentUrl)}`)
                        .then(r => r.json())
                        .then(d => setIdPresignedUrl(d.presignedUrl))
                );
            }

            await Promise.all(promises);
        } catch (err) {
            setError('Failed to load documents');
            console.error('Error fetching presigned URLs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchPresignedUrls();
    };

    const canCompare = profileImage && idDocumentUrl;

    if (!canCompare) {
        return null;
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleOpen}
                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
                <SplitSquareHorizontal className="w-4 h-4" />
                Compare Documents
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh]">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DialogHeader>
                        <DialogTitle>Document Comparison - {cleanerName}</DialogTitle>
                    </DialogHeader>

                    {loading && (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center min-h-[400px] text-red-500">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="grid grid-cols-2 gap-4 min-h-[500px]">
                            {/* Profile Photo */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium text-center mb-3 text-blue-600">
                                    Profile Photo (Selfie)
                                </h3>
                                <div className="flex items-center justify-center h-[400px] bg-slate-50 rounded overflow-hidden">
                                    {profilePresignedUrl ? (
                                        <img
                                            src={profilePresignedUrl}
                                            alt="Profile Photo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-muted-foreground">Not available</span>
                                    )}
                                </div>
                            </div>

                            {/* ID Document */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium text-center mb-3 text-green-600">
                                    Government ID Photo
                                </h3>
                                <div className="flex items-center justify-center h-[400px] bg-slate-50 rounded overflow-hidden">
                                    {idPresignedUrl ? (
                                        <img
                                            src={idPresignedUrl}
                                            alt="ID Document"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-muted-foreground">Not available</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                        Compare the profile selfie with the photo on the government ID to verify identity.
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
