'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    ArrowLeft,
    CreditCard,
    Mail,
    MessageSquare,
    CheckCircle,
    XCircle,
    ExternalLink,
    Key,
    Save,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import { saveAllIntegrationConfigs } from './actions';
import { toast } from 'sonner';

type ConfigState = Record<string, { maskedValue: string; isSet: boolean }>;

function StatusBadge({ configured }: { configured: boolean }) {
    return configured ? (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Configured
        </Badge>
    ) : (
        <Badge variant="outline" className="text-red-600 border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Not Configured
        </Badge>
    );
}

interface IntegrationInputProps {
    label: string;
    configKey: string;
    placeholder: string;
    value: string;
    maskedValue: string;
    isSet: boolean;
    onChange: (key: string, value: string) => void;
    type?: 'text' | 'password';
}

function IntegrationInput({ label, configKey, placeholder, value, maskedValue, isSet, onChange, type = 'password' }: IntegrationInputProps) {
    const [showValue, setShowValue] = useState(false);
    const hasNewValue = value.length > 0;

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                {label}
                <StatusBadge configured={isSet || hasNewValue} />
            </Label>
            <div className="relative">
                <Input
                    type={showValue ? 'text' : type}
                    value={value}
                    onChange={(e) => onChange(configKey, e.target.value)}
                    placeholder={isSet ? maskedValue || placeholder : placeholder}
                    className="font-mono text-sm pr-10"
                />
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowValue(!showValue)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {isSet && !hasNewValue && (
                <p className="text-xs text-muted-foreground">Current: {maskedValue}</p>
            )}
        </div>
    );
}

export function IntegrationsForm({ initialConfigs }: { initialConfigs: ConfigState }) {
    const [isPending, startTransition] = useTransition();
    const [values, setValues] = useState<Record<string, string>>({});

    const handleChange = (key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // Filter out empty values
        const toSave = Object.fromEntries(
            Object.entries(values).filter(([, v]) => v.trim().length > 0)
        );

        if (Object.keys(toSave).length === 0) {
            toast.info('No changes to save');
            return;
        }

        startTransition(async () => {
            try {
                const result = await saveAllIntegrationConfigs(toSave);
                if (result.success) {
                    toast.success(`Saved ${result.results.length} configuration(s)`);
                    setValues({}); // Clear form
                    // Refresh page to get updated masked values
                    window.location.reload();
                }
            } catch (error) {
                toast.error('Failed to save: ' + String(error));
            }
        });
    };

    const getConfig = (key: string) => initialConfigs[key] || { maskedValue: '', isSet: false };

    // Check if any integration is configured
    const stripeConfigured = getConfig('stripe_secret_key').isSet && getConfig('stripe_publishable_key').isSet;
    const twilioConfigured = getConfig('twilio_account_sid').isSet && getConfig('twilio_auth_token').isSet;
    const emailConfigured = getConfig('smtp_host').isSet || getConfig('resend_api_key').isSet;
    const pushConfigured = getConfig('vapid_public_key').isSet && getConfig('vapid_private_key').isSet;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Integrations</h1>
                        <p className="text-muted-foreground">Configure external service connections</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isPending || Object.keys(values).length === 0}>
                    {isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className={stripeConfigured ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CreditCard className={`w-8 h-8 ${stripeConfigured ? 'text-green-600' : 'text-red-600'}`} />
                            <div>
                                <p className="font-semibold">Stripe</p>
                                <p className="text-xs text-muted-foreground">{stripeConfigured ? 'Active' : 'Missing'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={twilioConfigured ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className={`w-8 h-8 ${twilioConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
                            <div>
                                <p className="font-semibold">Twilio SMS</p>
                                <p className="text-xs text-muted-foreground">{twilioConfigured ? 'Active' : 'Optional'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={emailConfigured ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Mail className={`w-8 h-8 ${emailConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
                            <div>
                                <p className="font-semibold">Email</p>
                                <p className="text-xs text-muted-foreground">{emailConfigured ? 'Active' : 'Optional'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={pushConfigured ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Key className={`w-8 h-8 ${pushConfigured ? 'text-green-600' : 'text-yellow-600'}`} />
                            <div>
                                <p className="font-semibold">Push</p>
                                <p className="text-xs text-muted-foreground">{pushConfigured ? 'Active' : 'Optional'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stripe */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Stripe Payments</CardTitle>
                                <CardDescription>Process payments and manage Connect accounts</CardDescription>
                            </div>
                        </div>
                        <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                            Dashboard <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <IntegrationInput
                            label="Secret Key"
                            configKey="stripe_secret_key"
                            placeholder="sk_live_..."
                            value={values.stripe_secret_key || ''}
                            maskedValue={getConfig('stripe_secret_key').maskedValue}
                            isSet={getConfig('stripe_secret_key').isSet}
                            onChange={handleChange}
                        />
                        <IntegrationInput
                            label="Publishable Key"
                            configKey="stripe_publishable_key"
                            placeholder="pk_live_..."
                            value={values.stripe_publishable_key || ''}
                            maskedValue={getConfig('stripe_publishable_key').maskedValue}
                            isSet={getConfig('stripe_publishable_key').isSet}
                            onChange={handleChange}
                        />
                    </div>
                    <IntegrationInput
                        label="Webhook Secret"
                        configKey="stripe_webhook_secret"
                        placeholder="whsec_..."
                        value={values.stripe_webhook_secret || ''}
                        maskedValue={getConfig('stripe_webhook_secret').maskedValue}
                        isSet={getConfig('stripe_webhook_secret').isSet}
                        onChange={handleChange}
                    />
                </CardContent>
            </Card>

            {/* Twilio */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle>Twilio SMS</CardTitle>
                                <CardDescription>Send SMS notifications to customers and cleaners</CardDescription>
                            </div>
                        </div>
                        <a
                            href="https://console.twilio.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-red-600 hover:underline flex items-center gap-1"
                        >
                            Console <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <IntegrationInput
                            label="Account SID"
                            configKey="twilio_account_sid"
                            placeholder="AC..."
                            value={values.twilio_account_sid || ''}
                            maskedValue={getConfig('twilio_account_sid').maskedValue}
                            isSet={getConfig('twilio_account_sid').isSet}
                            onChange={handleChange}
                        />
                        <IntegrationInput
                            label="Auth Token"
                            configKey="twilio_auth_token"
                            placeholder="Auth token"
                            value={values.twilio_auth_token || ''}
                            maskedValue={getConfig('twilio_auth_token').maskedValue}
                            isSet={getConfig('twilio_auth_token').isSet}
                            onChange={handleChange}
                        />
                    </div>
                    <IntegrationInput
                        label="Phone Number"
                        configKey="twilio_phone_number"
                        placeholder="+1234567890"
                        value={values.twilio_phone_number || ''}
                        maskedValue={getConfig('twilio_phone_number').maskedValue}
                        isSet={getConfig('twilio_phone_number').isSet}
                        onChange={handleChange}
                        type="text"
                    />
                </CardContent>
            </Card>

            {/* Email */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Email (SMTP / Resend)</CardTitle>
                                <CardDescription>Send transactional emails using your own SMTP server or Resend API</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* SMTP Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            📧 SMTP Server (Own Server)
                            {getConfig('smtp_host').isSet && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <IntegrationInput
                                label="SMTP Host"
                                configKey="smtp_host"
                                placeholder="smtp.seuservidor.com"
                                value={values.smtp_host || ''}
                                maskedValue={getConfig('smtp_host').maskedValue}
                                isSet={getConfig('smtp_host').isSet}
                                onChange={handleChange}
                                type="text"
                            />
                            <IntegrationInput
                                label="SMTP Port"
                                configKey="smtp_port"
                                placeholder="587"
                                value={values.smtp_port || ''}
                                maskedValue={getConfig('smtp_port').maskedValue}
                                isSet={getConfig('smtp_port').isSet}
                                onChange={handleChange}
                                type="text"
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <IntegrationInput
                                label="SMTP User"
                                configKey="smtp_user"
                                placeholder="user@seuservidor.com"
                                value={values.smtp_user || ''}
                                maskedValue={getConfig('smtp_user').maskedValue}
                                isSet={getConfig('smtp_user').isSet}
                                onChange={handleChange}
                                type="text"
                            />
                            <IntegrationInput
                                label="SMTP Password"
                                configKey="smtp_password"
                                placeholder="••••••••"
                                value={values.smtp_password || ''}
                                maskedValue={getConfig('smtp_password').maskedValue}
                                isSet={getConfig('smtp_password').isSet}
                                onChange={handleChange}
                            />
                        </div>
                        <IntegrationInput
                            label="From Email"
                            configKey="email_from"
                            placeholder="noreply@fixelo.app"
                            value={values.email_from || ''}
                            maskedValue={getConfig('email_from').maskedValue}
                            isSet={getConfig('email_from').isSet}
                            onChange={handleChange}
                            type="text"
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">or use</span>
                        </div>
                    </div>

                    {/* Resend Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            ✨ Resend API
                            {getConfig('resend_api_key').isSet && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                            <a
                                href="https://resend.com/dashboard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                            >
                                Dashboard <ExternalLink className="w-3 h-3" />
                            </a>
                        </h4>
                        <IntegrationInput
                            label="Resend API Key"
                            configKey="resend_api_key"
                            placeholder="re_..."
                            value={values.resend_api_key || ''}
                            maskedValue={getConfig('resend_api_key').maskedValue}
                            isSet={getConfig('resend_api_key').isSet}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Key className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Push Notifications</CardTitle>
                            <CardDescription>Browser push notifications using Web Push</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <IntegrationInput
                            label="VAPID Public Key"
                            configKey="vapid_public_key"
                            placeholder="BL..."
                            value={values.vapid_public_key || ''}
                            maskedValue={getConfig('vapid_public_key').maskedValue}
                            isSet={getConfig('vapid_public_key').isSet}
                            onChange={handleChange}
                        />
                        <IntegrationInput
                            label="VAPID Private Key"
                            configKey="vapid_private_key"
                            placeholder="Private key"
                            value={values.vapid_private_key || ''}
                            maskedValue={getConfig('vapid_private_key').maskedValue}
                            isSet={getConfig('vapid_private_key').isSet}
                            onChange={handleChange}
                        />
                    </div>
                    {!pushConfigured && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                Generate VAPID keys with: <code className="bg-blue-100 px-1 rounded">npx web-push generate-vapid-keys</code>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
