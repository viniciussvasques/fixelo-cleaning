'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Mail, Send, Eye, EyeOff } from 'lucide-react';

export const dynamic = 'force-dynamic';


interface EmailSettings {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromName: string;
    fromEmail: string;
    isEnabled: boolean;
}

export default function EmailSettingsPage() {
    const [settings, setSettings] = useState<EmailSettings>({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromName: 'Fixelo',
        fromEmail: 'no-reply@fixelo.app',
        isEnabled: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/email');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success('Email settings saved!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            toast.error('Enter a test email address');
            return;
        }

        setIsTesting(true);
        try {
            const res = await fetch('/api/admin/settings/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: testEmail }),
            });

            if (!res.ok) throw new Error('Failed to send');
            toast.success('Test email sent successfully!');
        } catch (error) {
            toast.error('Failed to send test email');
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="w-8 h-8" />
                    Email Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure SMTP server for sending emails
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>
                        Server settings for outgoing email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-medium">Enable Email Sending</p>
                            <p className="text-sm text-muted-foreground">
                                Turn off to disable all email notifications
                            </p>
                        </div>
                        <Switch
                            checked={settings.isEnabled}
                            onCheckedChange={(v) => setSettings(prev => ({ ...prev, isEnabled: v }))}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <Input
                                value={settings.smtpHost}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                                placeholder="smtp.example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input
                                type="number"
                                value={settings.smtpPort}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>SMTP Username</Label>
                            <Input
                                value={settings.smtpUser}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={settings.smtpPassword}
                                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sender Information</CardTitle>
                    <CardDescription>
                        How emails appear to recipients
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>From Name</Label>
                            <Input
                                value={settings.fromName}
                                onChange={(e) => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                                placeholder="Fixelo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Email</Label>
                            <Input
                                type="email"
                                value={settings.fromEmail}
                                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                                placeholder="no-reply@fixelo.app"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test Email</CardTitle>
                    <CardDescription>
                        Send a test email to verify configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="flex-1"
                        />
                        <Button variant="outline" onClick={handleTestEmail} disabled={isTesting}>
                            {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Test
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Email Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
