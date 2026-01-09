'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Building2, Phone, Globe } from 'lucide-react';

interface CompanySettings {
    companyName: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    websiteUrl: string;
    termsUrl: string;
    privacyUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    facebookUrl: string;
}

export default function CompanySettingsPage() {
    const [settings, setSettings] = useState<CompanySettings>({
        companyName: 'Fixelo',
        supportEmail: '',
        supportPhone: '',
        address: '',
        websiteUrl: '',
        termsUrl: '',
        privacyUrl: '',
        linkedinUrl: '',
        instagramUrl: '',
        facebookUrl: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/company');
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
            const res = await fetch('/api/admin/settings/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success('Company settings saved!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
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
                    <Building2 className="w-8 h-8" />
                    Company Information
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure business details and contact information
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>
                        Basic company information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                            value={settings.companyName}
                            onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                            value={settings.address}
                            onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="123 Main St, Orlando, FL 32801"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Support Contact
                    </CardTitle>
                    <CardDescription>
                        How customers can reach support
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Support Email</Label>
                            <Input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                placeholder="support@fixelo.app"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Support Phone</Label>
                            <Input
                                type="tel"
                                value={settings.supportPhone}
                                onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                                placeholder="+1 (407) 555-0123"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Links & Social Media
                    </CardTitle>
                    <CardDescription>
                        Website URLs and social profiles
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Website URL</Label>
                            <Input
                                value={settings.websiteUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                                placeholder="https://fixelo.app"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Terms of Service URL</Label>
                            <Input
                                value={settings.termsUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, termsUrl: e.target.value }))}
                                placeholder="https://fixelo.app/terms"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Privacy Policy URL</Label>
                        <Input
                            value={settings.privacyUrl}
                            onChange={(e) => setSettings(prev => ({ ...prev, privacyUrl: e.target.value }))}
                            placeholder="https://fixelo.app/privacy"
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Facebook</Label>
                            <Input
                                value={settings.facebookUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                                placeholder="https://facebook.com/fixelo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Instagram</Label>
                            <Input
                                value={settings.instagramUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                                placeholder="https://instagram.com/fixelo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn</Label>
                            <Input
                                value={settings.linkedinUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                placeholder="https://linkedin.com/company/fixelo"
                            />
                        </div>
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
                            Save Company Info
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
