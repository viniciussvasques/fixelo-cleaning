'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Loader2, DollarSign, Percent, Clock, AlertTriangle, Camera, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface FinancialSettings {
    platformFeePercent: number;
    insuranceFeePercent: number;
    autoPayoutEnabled: boolean;
    payoutSchedule: string;
    payoutDay: string;
    minPayoutAmount: number;
    holdDaysAfterService: number;
    requireCustomerReview: boolean;
    minBookingAmount: number;
    weeklyDiscount: number;
    biweeklyDiscount: number;
    monthlyDiscount: number;
    freeCancelHours: number;
    lateCancelFeePercent: number;
    cleanerStrikePenalty: number;
    maxStrikes: number;
    autoRefundThreshold: number;
    recleanWindowHours: number;
    requiredBeforePhotos: number;
    requiredAfterPhotos: number;
    geofenceRadiusMeters: number;
}

export default function FinancialSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { register, handleSubmit, setValue, watch, reset } = useForm<FinancialSettings>();

    // For Calculator
    const [testAmount, setTestAmount] = useState(180);
    const platformFeePercent = watch('platformFeePercent') || 15;
    const insuranceFeePercent = watch('insuranceFeePercent') || 2;
    const stripeFeePercent = 2.9;
    const stripeFeeFixed = 0.30;

    const calc = {
        stripe: (testAmount * (stripeFeePercent / 100)) + stripeFeeFixed,
        platform: (testAmount - ((testAmount * (stripeFeePercent / 100)) + stripeFeeFixed)) * (platformFeePercent / 100),
        insurance: (testAmount - ((testAmount * (stripeFeePercent / 100)) + stripeFeeFixed)) * (insuranceFeePercent / 100),
        net: 0
    };
    calc.net = (testAmount - calc.stripe - calc.platform - calc.insurance);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/financial-settings');
                if (res.ok) {
                    const data = await res.json();
                    // Convert decimals to percentages for display
                    const displayData = {
                        ...data,
                        platformFeePercent: (data.platformFeePercent || 0.15) * 100,
                        insuranceFeePercent: (data.insuranceFeePercent || 0.02) * 100,
                        weeklyDiscount: (data.weeklyDiscount || 0.15) * 100,
                        biweeklyDiscount: (data.biweeklyDiscount || 0.10) * 100,
                        monthlyDiscount: (data.monthlyDiscount || 0.05) * 100,
                        lateCancelFeePercent: (data.lateCancelFeePercent || 0.50) * 100,
                    };
                    reset(displayData);
                }
            } catch (_error) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [reset]);

    const onSubmit = async (data: FinancialSettings) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/financial-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Financial settings saved successfully');
        } catch (_error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Financial Settings</h1>
                    <p className="text-muted-foreground">Configure fees, payouts, discounts, and policies</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Tabs defaultValue="fees" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="fees">Fees</TabsTrigger>
                        <TabsTrigger value="payouts">Payouts</TabsTrigger>
                        <TabsTrigger value="discounts">Discounts</TabsTrigger>
                        <TabsTrigger value="cancellation">Cancellation</TabsTrigger>
                        <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    </TabsList>

                    {/* FEES TAB */}
                    <TabsContent value="fees">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Platform Fees
                                </CardTitle>
                                <CardDescription>Configure the commission structure for bookings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Platform Commission (%)</Label>
                                        <Input type="number" step="0.1" {...register('platformFeePercent')} />
                                        <p className="text-xs text-muted-foreground">Default: 15%</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Insurance Fee (%)</Label>
                                        <Input type="number" step="0.1" {...register('insuranceFeePercent')} />
                                        <p className="text-xs text-muted-foreground">Default: 2%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Stripe Fee % (Read-only)</Label>
                                        <Input value={stripeFeePercent} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stripe Fixed Fee $ (Read-only)</Label>
                                        <Input value={stripeFeeFixed} disabled />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Minimum Booking Amount ($)</Label>
                                    <Input type="number" {...register('minBookingAmount')} />
                                    <p className="text-xs text-muted-foreground">Bookings below this amount won't be accepted</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Calculator */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Payout Calculator</CardTitle>
                                <CardDescription>Simulate a booking payout with current settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Booking Amount ($)</Label>
                                        <Input
                                            type="number"
                                            value={testAmount}
                                            onChange={(e) => setTestAmount(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Client Pays:</span>
                                            <span>${testAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500 text-sm">
                                            <span>- Stripe Fee ({stripeFeePercent}% + ${stripeFeeFixed}):</span>
                                            <span>-${calc.stripe.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500 text-sm">
                                            <span>- Platform Fee ({platformFeePercent}%):</span>
                                            <span>-${calc.platform.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-500 text-sm border-b pb-3">
                                            <span>- Insurance ({insuranceFeePercent}%):</span>
                                            <span>-${calc.insurance.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between text-xl font-bold pt-2">
                                            <span>Cleaner Receives:</span>
                                            <span className="text-green-600">${calc.net.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between text-sm text-gray-500 pt-2">
                                            <span>Platform Revenue:</span>
                                            <span>${(calc.platform + calc.insurance).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PAYOUTS TAB */}
                    <TabsContent value="payouts">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Payout Schedule
                                </CardTitle>
                                <CardDescription>Configure when cleaners receive their earnings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="autoPayout"
                                        onCheckedChange={(checked) => setValue('autoPayoutEnabled', checked as boolean)}
                                        checked={watch('autoPayoutEnabled')}
                                    />
                                    <Label htmlFor="autoPayout">Enable Automatic Payouts</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payout Frequency</Label>
                                        <Select onValueChange={(v) => setValue('payoutSchedule', v)} value={watch('payoutSchedule')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select schedule" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payout Day</Label>
                                        <Select onValueChange={(v) => setValue('payoutDay', v)} value={watch('payoutDay')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Monday">Monday</SelectItem>
                                                <SelectItem value="Friday">Friday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Payout Amount ($)</Label>
                                        <Input type="number" {...register('minPayoutAmount')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hold Days After Service</Label>
                                        <Input type="number" {...register('holdDaysAfterService')} />
                                        <p className="text-xs text-muted-foreground">Days to hold funds before payout</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="reqReview"
                                        onCheckedChange={(checked) => setValue('requireCustomerReview', checked as boolean)}
                                        checked={watch('requireCustomerReview')}
                                    />
                                    <Label htmlFor="reqReview">Require Customer Review Before Payout</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* DISCOUNTS TAB */}
                    <TabsContent value="discounts">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Percent className="w-5 h-5" />
                                    Recurring Booking Discounts
                                </CardTitle>
                                <CardDescription>Set discounts for customers who book recurring services.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Weekly Discount (%)</Label>
                                        <Input type="number" step="1" {...register('weeklyDiscount')} />
                                        <p className="text-xs text-muted-foreground">Default: 15%</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bi-Weekly Discount (%)</Label>
                                        <Input type="number" step="1" {...register('biweeklyDiscount')} />
                                        <p className="text-xs text-muted-foreground">Default: 10%</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monthly Discount (%)</Label>
                                        <Input type="number" step="1" {...register('monthlyDiscount')} />
                                        <p className="text-xs text-muted-foreground">Default: 5%</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Example:</strong> A $180 booking with weekly discount (15%) = <strong>${(180 * 0.85).toFixed(2)}</strong>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CANCELLATION TAB */}
                    <TabsContent value="cancellation">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Cancellation Policy
                                </CardTitle>
                                <CardDescription>Configure cancellation fees and penalties.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Free Cancellation Window (hours)</Label>
                                        <Input type="number" {...register('freeCancelHours')} />
                                        <p className="text-xs text-muted-foreground">Hours before service for free cancellation</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Late Cancellation Fee (%)</Label>
                                        <Input type="number" step="1" {...register('lateCancelFeePercent')} />
                                        <p className="text-xs text-muted-foreground">% of booking charged if cancelled late</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Cleaner Cancellation Penalties</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Strike Penalty ($)</Label>
                                            <Input type="number" {...register('cleanerStrikePenalty')} />
                                            <p className="text-xs text-muted-foreground">Fee deducted from cleaner's earnings</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max Strikes Before Suspension</Label>
                                            <Input type="number" {...register('maxStrikes')} />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Quality Guarantee</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Auto-Refund Rating Threshold</Label>
                                            <Input type="number" min="1" max="5" {...register('autoRefundThreshold')} />
                                            <p className="text-xs text-muted-foreground">Auto-approve refunds if rating ≤ this</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Re-clean Request Window (hours)</Label>
                                            <Input type="number" {...register('recleanWindowHours')} />
                                            <p className="text-xs text-muted-foreground">Hours after service to report issues</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* JOBS TAB */}
                    <TabsContent value="jobs">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="w-5 h-5" />
                                    Job Execution Settings
                                </CardTitle>
                                <CardDescription>Configure requirements for job check-in and completion.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Required "Before" Photos</Label>
                                        <Input type="number" min="0" max="10" {...register('requiredBeforePhotos')} />
                                        <p className="text-xs text-muted-foreground">Photos required before starting</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Required "After" Photos</Label>
                                        <Input type="number" min="0" max="10" {...register('requiredAfterPhotos')} />
                                        <p className="text-xs text-muted-foreground">Photos required to complete</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Geofence Radius (meters)
                                    </Label>
                                    <Input type="number" min="50" max="500" {...register('geofenceRadiusMeters')} />
                                    <p className="text-xs text-muted-foreground">
                                        Cleaners must be within this distance to check-in. Default: 100m
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save All Settings
                        </Button>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}
