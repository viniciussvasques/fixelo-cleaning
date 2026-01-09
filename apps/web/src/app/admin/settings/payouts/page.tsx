'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, DollarSign, Calendar, Clock } from 'lucide-react';

interface PayoutSettings {
    autoPayoutEnabled: boolean;
    payoutSchedule: string;
    payoutDay: string;
    minPayoutAmount: number;
    holdDaysAfterService: number;
    requireCustomerReview: boolean;
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SCHEDULES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export default function PayoutSettingsPage() {
    const [settings, setSettings] = useState<PayoutSettings>({
        autoPayoutEnabled: true,
        payoutSchedule: 'WEEKLY',
        payoutDay: 'FRIDAY',
        minPayoutAmount: 50,
        holdDaysAfterService: 2,
        requireCustomerReview: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/payouts');
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
            const res = await fetch('/api/admin/settings/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success('Payout settings saved!');
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
                    <DollarSign className="w-8 h-8" />
                    Payout Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure automatic payout scheduling for cleaners
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Automatic Payouts
                    </CardTitle>
                    <CardDescription>
                        Control when and how cleaners receive their earnings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Auto Payout Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-medium">Enable Automatic Payouts</p>
                            <p className="text-sm text-muted-foreground">
                                Automatically transfer earnings to cleaners
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoPayoutEnabled}
                            onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoPayoutEnabled: v }))}
                        />
                    </div>

                    {settings.autoPayoutEnabled && (
                        <>
                            {/* Schedule */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Payout Frequency</Label>
                                    <Select
                                        value={settings.payoutSchedule}
                                        onValueChange={(v) => setSettings(prev => ({ ...prev, payoutSchedule: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SCHEDULES.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {settings.payoutSchedule !== 'DAILY' && (
                                    <div className="space-y-2">
                                        <Label>Payout Day</Label>
                                        <Select
                                            value={settings.payoutDay}
                                            onValueChange={(v) => setSettings(prev => ({ ...prev, payoutDay: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Minimum Amount */}
                            <div className="space-y-2">
                                <Label>Minimum Payout Amount ($)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={settings.minPayoutAmount}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        minPayoutAmount: parseFloat(e.target.value) || 0
                                    }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Cleaners must earn at least this amount before receiving a payout
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Hold Period
                    </CardTitle>
                    <CardDescription>
                        Protection period before releasing funds
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Hold Days After Service</Label>
                        <Input
                            type="number"
                            min="0"
                            max="14"
                            value={settings.holdDaysAfterService}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                holdDaysAfterService: parseInt(e.target.value) || 0
                            }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Days to wait after job completion before funds become available for payout
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-medium">Require Customer Review</p>
                            <p className="text-sm text-muted-foreground">
                                Only release funds after customer reviews the service
                            </p>
                        </div>
                        <Switch
                            checked={settings.requireCustomerReview}
                            onCheckedChange={(v) => setSettings(prev => ({ ...prev, requireCustomerReview: v }))}
                        />
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
                            Save Payout Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
