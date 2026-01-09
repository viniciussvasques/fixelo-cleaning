import { prisma } from "@fixelo/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSystemConfig } from "./actions";

export default async function SettingsPage() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: ['platform_commission', 'max_bedrooms', 'max_bathrooms'] }
        }
    });

    const getVal = (key: string, def: string) =>
        configs.find(c => c.key === key)?.value || def;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Platform Settings</h1>

            <form action={updateSystemConfig}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fees & Commissions</CardTitle>
                            <CardDescription>Configure global platform fees and commissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Platform Commission (%)</Label>
                                    <Input
                                        name="platformFee"
                                        defaultValue={getVal('platform_commission', '30')}
                                        type="number"
                                        step="0.1"
                                    />
                                    <p className="text-xs text-muted-foreground">The percentage taken from each booking.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Configuration</CardTitle>
                            <CardDescription>Set global limits for booking flows.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Max Bedrooms</Label>
                                    <Input
                                        name="maxBedrooms"
                                        defaultValue={getVal('max_bedrooms', '6')}
                                        type="number"
                                    />
                                    <p className="text-xs text-muted-foreground">Maximum number of bedrooms allowed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Bathrooms</Label>
                                    <Input
                                        name="maxBathrooms"
                                        defaultValue={getVal('max_bathrooms', '5')}
                                        type="number"
                                    />
                                    <p className="text-xs text-muted-foreground">Maximum number of bathrooms allowed.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit">Save All Changes</Button>
                    </div>
                </div>
            </form>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            🔌 Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">Configure Stripe, Twilio, Email, and Push notifications.</p>
                        <a href="/admin/settings/integrations" className="text-primary text-sm font-medium hover:underline">
                            Manage Integrations →
                        </a>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            📧 Email Templates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">Customize notification email templates.</p>
                        <a href="/admin/settings/email" className="text-primary text-sm font-medium hover:underline">
                            Manage Templates →
                        </a>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            💰 Payouts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">Configure cleaner payout schedules and rules.</p>
                        <a href="/admin/settings/payouts" className="text-primary text-sm font-medium hover:underline">
                            Manage Payouts →
                        </a>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-medium">Version</span>
                            <span>1.0.0</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 pt-2">
                            <span className="font-medium">Environment</span>
                            <span>Production</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
