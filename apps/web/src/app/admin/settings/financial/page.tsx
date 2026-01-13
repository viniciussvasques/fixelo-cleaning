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

export const dynamic = 'force-dynamic';


export default function FinancialSettingsPage() {
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, setValue, watch } = useForm();

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
                    Object.keys(data).forEach(key => {
                        setValue(key, data[key]);
                    });
                }
            } catch (_error) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [setValue]);

    const onSubmit = async (data: Record<string, unknown>) => {
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
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Financial Settings</h1>

            <Tabs defaultValue="fees" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fees">Fees & Commissions</TabsTrigger>
                    <TabsTrigger value="payouts">Payout Schedule</TabsTrigger>
                    <TabsTrigger value="calculator">Profit Calculator</TabsTrigger>
                </TabsList>

                <TabsContent value="fees">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Fees</CardTitle>
                            <CardDescription>Configure the commission structure for bookings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                <Button type="submit">Save Changes</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout Schedule</CardTitle>
                            <CardDescription>Configure when service providers receive their earnings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="autoPayout"
                                        onCheckedChange={(checked) => setValue('autoPayoutEnabled', checked)}
                                        {...register('autoPayoutEnabled')}
                                    />
                                    <Label htmlFor="autoPayout">Enable Automatic Payouts</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payout Frequency</Label>
                                        <Select onValueChange={(v) => setValue('payoutSchedule', v)} defaultValue={watch('payoutSchedule')}>
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
                                        <Select onValueChange={(v) => setValue('payoutDay', v)} defaultValue={watch('payoutDay')}>
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

                                <div className="space-y-2">
                                    <Label>Minimum Payout Amount ($)</Label>
                                    <Input type="number" {...register('minPayoutAmount')} />
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3">Retention Rules</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Hold Days After Service</Label>
                                            <Input type="number" {...register('holdDaysAfterService')} />
                                            <p className="text-xs text-muted-foreground">Days to hold funds before eligible for payout</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="reqReview"
                                                onCheckedChange={(checked) => setValue('requireCustomerReview', checked)}
                                                {...register('requireCustomerReview')}
                                            />
                                            <Label htmlFor="reqReview">Require Customer Review</Label>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit">Save Settings</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calculator">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout Simulator</CardTitle>
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
                                        <span>Provider Receives:</span>
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
            </Tabs>
        </div>
    );
}
