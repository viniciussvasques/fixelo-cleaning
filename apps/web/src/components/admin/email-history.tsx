'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailLogEntry {
    id: string;
    type: string;
    subject: string;
    recipient: string;
    status: string;
    sentAt: string;
}

interface EmailHistoryProps {
    cleanerId: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
    ONBOARDING_REMINDER: { label: 'Onboarding Reminder', color: 'bg-blue-100 text-blue-800' },
    DOCUMENT_REQUEST: { label: 'Document Request', color: 'bg-orange-100 text-orange-800' },
    APPROVAL: { label: 'Approval', color: 'bg-green-100 text-green-800' },
    REJECTION: { label: 'Rejection', color: 'bg-red-100 text-red-800' },
    ROLE_CHANGE: { label: 'Role Change', color: 'bg-purple-100 text-purple-800' },
    GENERAL: { label: 'General', color: 'bg-gray-100 text-gray-800' },
};

export function EmailHistory({ cleanerId }: EmailHistoryProps) {
    const [emails, setEmails] = useState<EmailLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const response = await fetch(`/api/admin/email-history?cleanerId=${cleanerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setEmails(data.emails || []);
                } else {
                    setError('Failed to load email history');
                }
            } catch (err) {
                setError('Failed to load email history');
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [cleanerId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-600 py-2">{error}</div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-2 italic">
                No emails sent yet
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {emails.map((email) => {
                const typeInfo = typeLabels[email.type] || typeLabels.GENERAL;
                return (
                    <div key={email.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Mail className="w-4 h-4 text-slate-400 mt-1" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${typeInfo.color} text-xs`}>
                                    {typeInfo.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {email.status}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1 truncate">{email.subject}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
