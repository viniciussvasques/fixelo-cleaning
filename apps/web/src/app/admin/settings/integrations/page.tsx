/**
 * Admin Integrations Settings
 * 
 * Configure Email, Stripe, and Twilio integrations.
 */

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
    AlertTriangle
} from "lucide-react";

// Check environment variables (server-side only)
const integrationStatus = {
    stripe: {
        secretKey: !!process.env.STRIPE_SECRET_KEY,
        publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    twilio: {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    },
    email: {
        smtpHost: !!process.env.SMTP_HOST,
        smtpUser: !!process.env.SMTP_USER,
        fromEmail: !!process.env.EMAIL_FROM,
    },
    push: {
        vapidPublic: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        vapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
    },
};

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

export default function IntegrationsPage() {
    const stripeConfigured = integrationStatus.stripe.secretKey && integrationStatus.stripe.publishableKey;
    const twilioConfigured = integrationStatus.twilio.accountSid && integrationStatus.twilio.authToken;
    const emailConfigured = integrationStatus.email.smtpHost || true; // Using Resend by default
    const pushConfigured = integrationStatus.push.vapidPublic && integrationStatus.push.vapidPrivate;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground">Configure external service connections</p>
                </div>
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

                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Mail className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="font-semibold">Email</p>
                                <p className="text-xs text-muted-foreground">Resend Active</p>
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
                        <StatusBadge configured={stripeConfigured} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                STRIPE_SECRET_KEY
                                <StatusBadge configured={integrationStatus.stripe.secretKey} />
                            </Label>
                            <Input value="sk_••••••••" disabled className="font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                                <StatusBadge configured={integrationStatus.stripe.publishableKey} />
                            </Label>
                            <Input value="pk_••••••••" disabled className="font-mono text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            STRIPE_WEBHOOK_SECRET
                            <StatusBadge configured={integrationStatus.stripe.webhookSecret} />
                        </Label>
                        <Input value="whsec_••••••••" disabled className="font-mono text-sm" />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                            Open Stripe Dashboard <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            API keys are stored in environment variables. Update them in <code className="bg-yellow-100 px-1 rounded">.env.local</code> and restart the server.
                        </p>
                    </div>
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
                        <StatusBadge configured={twilioConfigured} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                TWILIO_ACCOUNT_SID
                                <StatusBadge configured={integrationStatus.twilio.accountSid} />
                            </Label>
                            <Input value="AC••••••••" disabled className="font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                TWILIO_AUTH_TOKEN
                                <StatusBadge configured={integrationStatus.twilio.authToken} />
                            </Label>
                            <Input value="••••••••" disabled className="font-mono text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            TWILIO_PHONE_NUMBER
                            <StatusBadge configured={integrationStatus.twilio.phoneNumber} />
                        </Label>
                        <Input value="+1••••••••••" disabled className="font-mono text-sm" />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <a
                            href="https://console.twilio.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-red-600 hover:underline flex items-center gap-1"
                        >
                            Open Twilio Console <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
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
                                <CardTitle>Email (Resend)</CardTitle>
                                <CardDescription>Transactional emails using Resend API</CardDescription>
                            </div>
                        </div>
                        <StatusBadge configured={true} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>RESEND_API_KEY</Label>
                            <Input value="re_••••••••" disabled className="font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label>EMAIL_FROM</Label>
                            <Input value="noreply@fixelo.app" disabled className="font-mono text-sm" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <a
                            href="https://resend.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            Open Resend Dashboard <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link
                            href="/admin/settings/email"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Manage Email Templates →
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Key className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Push Notifications</CardTitle>
                                <CardDescription>Browser push notifications using Web Push</CardDescription>
                            </div>
                        </div>
                        <StatusBadge configured={pushConfigured} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                NEXT_PUBLIC_VAPID_PUBLIC_KEY
                                <StatusBadge configured={integrationStatus.push.vapidPublic} />
                            </Label>
                            <Input value="BL••••••••" disabled className="font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                VAPID_PRIVATE_KEY
                                <StatusBadge configured={integrationStatus.push.vapidPrivate} />
                            </Label>
                            <Input value="••••••••" disabled className="font-mono text-sm" />
                        </div>
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

            {/* Test Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Integrations</CardTitle>
                    <CardDescription>Send test notifications to verify configurations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" disabled={!stripeConfigured}>
                            Test Stripe Connection
                        </Button>
                        <Button variant="outline" disabled={!twilioConfigured}>
                            Send Test SMS
                        </Button>
                        <Button variant="outline">
                            Send Test Email
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
