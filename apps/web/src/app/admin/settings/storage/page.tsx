'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    HardDrive,
    ArrowLeft,
    Loader2,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Zap,
    Cloud,
    Upload,
} from 'lucide-react';
import Link from 'next/link';

interface StorageSettings {
    s3_region: string;
    s3_access_key: string;
    s3_secret_key: string;
    s3_bucket: string;
}

export default function StorageSettingsPage() {
    const [settings, setSettings] = useState<StorageSettings>({
        s3_region: '',
        s3_access_key: '',
        s3_secret_key: '',
        s3_bucket: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showSecret, setShowSecret] = useState(false);

    // New values (only send if changed)
    const [newValues, setNewValues] = useState<Partial<StorageSettings>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/storage-settings');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            toast.error('Failed to load storage settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: keyof StorageSettings, value: string) => {
        setNewValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (Object.keys(newValues).length === 0) {
            toast.info('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                s3_region: newValues.s3_region || settings.s3_region,
                s3_access_key: newValues.s3_access_key || settings.s3_access_key,
                s3_secret_key: newValues.s3_secret_key || settings.s3_secret_key,
                s3_bucket: newValues.s3_bucket || settings.s3_bucket,
            };

            const res = await fetch('/api/admin/storage-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Storage settings saved');
            setNewValues({});
            fetchSettings();
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/storage-settings/test', { method: 'POST' });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
            });
            if (data.success) {
                toast.success('S3 connection successful!');
            } else {
                toast.error('S3 connection failed: ' + data.message);
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Failed to test connection',
            });
            toast.error('Failed to test connection');
        } finally {
            setTesting(false);
        }
    };

    const isConfigured = settings.s3_bucket && settings.s3_region && 
                         !settings.s3_access_key.includes('••••') === false;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Storage Settings</h1>
                    <p className="text-muted-foreground">Configure AWS S3 for file uploads</p>
                </div>
            </div>

            {/* Status Card */}
            <Card className={isConfigured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isConfigured ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <Cloud className={`w-6 h-6 ${isConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                            <p className="font-semibold">{isConfigured ? 'S3 Configured' : 'S3 Not Configured'}</p>
                            <p className="text-sm text-muted-foreground">
                                {isConfigured 
                                    ? `Bucket: ${settings.s3_bucket} (${settings.s3_region})`
                                    : 'Configure AWS S3 credentials to enable file uploads'}
                            </p>
                        </div>
                        {isConfigured && (
                            <Badge className="ml-auto bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Settings Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5" />
                        AWS S3 Configuration
                    </CardTitle>
                    <CardDescription>
                        Enter your AWS S3 credentials for storing uploaded photos and documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>AWS Region</Label>
                            <Input
                                placeholder="us-east-1"
                                value={newValues.s3_region ?? settings.s3_region}
                                onChange={(e) => handleChange('s3_region', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">e.g., us-east-1, eu-west-1</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Bucket Name</Label>
                            <Input
                                placeholder="my-fixelo-bucket"
                                value={newValues.s3_bucket ?? settings.s3_bucket}
                                onChange={(e) => handleChange('s3_bucket', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Access Key ID</Label>
                        <Input
                            placeholder="AKIA..."
                            value={newValues.s3_access_key ?? settings.s3_access_key}
                            onChange={(e) => handleChange('s3_access_key', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Secret Access Key</Label>
                        <div className="relative">
                            <Input
                                type={showSecret ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={newValues.s3_secret_key ?? settings.s3_secret_key}
                                onChange={(e) => handleChange('s3_secret_key', e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleSave} disabled={saving || Object.keys(newValues).length === 0}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Settings
                        </Button>

                        <Button variant="outline" onClick={handleTest} disabled={testing || !isConfigured}>
                            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            Test Connection
                        </Button>
                    </div>

                    {testResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span className="text-sm">{testResult.message}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Usage Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Photos & Documents</span>
                            <span className="text-sm font-medium">Stored in S3</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Supported Formats</span>
                            <span className="text-sm">JPEG, PNG, WebP, PDF</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Max File Size</span>
                            <span className="text-sm">10 MB</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
