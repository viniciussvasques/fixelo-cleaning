'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle } from 'lucide-react';

interface SendRemindersButtonProps {
    count: number;
}

export function SendRemindersButton({ count }: SendRemindersButtonProps) {
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);

    const handleSendReminders = async () => {
        setSending(true);
        setResult(null);

        try {
            const response = await fetch('/api/cron/onboarding-reminders', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setResult({
                    sent: data.results?.sent || 0,
                    errors: data.results?.errors || 0,
                });
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={handleSendReminders}
                disabled={sending || count === 0}
                variant="outline"
                size="sm"
                className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
                {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                Send Reminders to All
            </Button>

            {result && (
                <span className="text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Sent {result.sent} emails
                    {result.errors > 0 && ` (${result.errors} errors)`}
                </span>
            )}
        </div>
    );
}
