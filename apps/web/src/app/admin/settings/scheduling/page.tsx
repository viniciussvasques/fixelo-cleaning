'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Clock, MapPin, Calendar } from 'lucide-react';

interface BusinessSettings {
    businessHoursStart: string;
    businessHoursEnd: string;
    operatingDays: string[];
    timezone: string;
    bookingLeadTimeHours: number;
    serviceRadiusKm: number;
}

const DAYS = [
    { id: 'MON', label: 'Monday' },
    { id: 'TUE', label: 'Tuesday' },
    { id: 'WED', label: 'Wednesday' },
    { id: 'THU', label: 'Thursday' },
    { id: 'FRI', label: 'Friday' },
    { id: 'SAT', label: 'Saturday' },
    { id: 'SUN', label: 'Sunday' },
];

const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Sao_Paulo',
];

export default function SchedulingSettingsPage() {
    const [settings, setSettings] = useState<BusinessSettings>({
        businessHoursStart: '08:00',
        businessHoursEnd: '20:00',
        operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        timezone: 'America/New_York',
        bookingLeadTimeHours: 24,
        serviceRadiusKm: 50,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/scheduling');
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
        if (settings.operatingDays.length === 0) {
            toast.error('Select at least one operating day');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings/scheduling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success('Business settings saved!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (dayId: string) => {
        setSettings(prev => ({
            ...prev,
            operatingDays: prev.operatingDays.includes(dayId)
                ? prev.operatingDays.filter(d => d !== dayId)
                : [...prev.operatingDays, dayId]
        }));
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
                    <Calendar className="w-8 h-8" />
                    Business Hours & Scheduling
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure operating hours and booking rules
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Operating Hours
                    </CardTitle>
                    <CardDescription>
                        When customers can book cleaning services
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Opening Time</Label>
                            <Input
                                type="time"
                                value={settings.businessHoursStart}
                                onChange={(e) => setSettings(prev => ({ ...prev, businessHoursStart: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Closing Time</Label>
                            <Input
                                type="time"
                                value={settings.businessHoursEnd}
                                onChange={(e) => setSettings(prev => ({ ...prev, businessHoursEnd: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                            value={settings.timezone}
                            onValueChange={(v) => setSettings(prev => ({ ...prev, timezone: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map(tz => (
                                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Operating Days</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {DAYS.map(day => (
                                <div
                                    key={day.id}
                                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${settings.operatingDays.includes(day.id)
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-white hover:bg-slate-50'
                                        }`}
                                    onClick={() => toggleDay(day.id)}
                                >
                                    <Checkbox checked={settings.operatingDays.includes(day.id)} />
                                    <span className="text-sm font-medium">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Booking Rules
                    </CardTitle>
                    <CardDescription>
                        Lead time and service area configuration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Minimum Booking Lead Time (hours)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="168"
                                value={settings.bookingLeadTimeHours}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    bookingLeadTimeHours: parseInt(e.target.value) || 24
                                }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                How far in advance customers must book
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Service Radius (km)</Label>
                            <Input
                                type="number"
                                min="5"
                                max="200"
                                value={settings.serviceRadiusKm}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    serviceRadiusKm: parseInt(e.target.value) || 50
                                }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum distance cleaners will travel
                            </p>
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
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
