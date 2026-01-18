'use client';

import { useState } from 'react';
import { ExternalLink, Eye, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DocumentViewerProps {
    url: string | null;
    label: string;
    type?: 'image' | 'pdf';
}

export function DocumentViewer({ url, label, type = 'image' }: DocumentViewerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPresignedUrl = async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/documents?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok && data.presignedUrl) {
                setPresignedUrl(data.presignedUrl);
            } else {
                setError(data.error || 'Failed to load document');
            }
        } catch (err) {
            setError('Failed to load document');
            console.error('Error fetching presigned URL:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchPresignedUrl();
    };

    const openInNewTab = async () => {
        if (!url) return;

        try {
            const response = await fetch(`/api/admin/documents?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok && data.presignedUrl) {
                window.open(data.presignedUrl, '_blank');
            } else {
                alert('Failed to load document');
            }
        } catch (err) {
            alert('Failed to load document');
        }
    };

    if (!url) {
        return (
            <span className="text-sm text-muted-foreground italic">
                Not uploaded
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleOpen}>
                <Eye className="w-3 h-3" />
                View
            </Button>

            <Button variant="ghost" size="sm" onClick={openInNewTab} className="gap-1">
                <ExternalLink className="w-3 h-3" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DialogHeader>
                        <DialogTitle>{label}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center min-h-[400px]">
                        {loading && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading document...
                            </div>
                        )}
                        {error && (
                            <div className="text-red-500 text-center">
                                <p>{error}</p>
                                <p className="text-sm mt-2">The document may not exist or S3 access may be misconfigured.</p>
                            </div>
                        )}
                        {presignedUrl && !loading && !error && (
                            type === 'pdf' ? (
                                <iframe
                                    src={presignedUrl}
                                    className="w-full h-[70vh]"
                                    title={label}
                                />
                            ) : (
                                <img
                                    src={presignedUrl}
                                    alt={label}
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
