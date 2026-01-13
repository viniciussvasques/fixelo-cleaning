'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Percent, Check, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface RecurringSetupProps {
    serviceTypeId: string;
    addressId: string;
    bedrooms: number;
    bathrooms: number;
    hasPets: boolean;
    specialInstructions?: string;
    onSuccess?: (recurring: any) => void;
    onSkip?: () => void;
}

const FREQUENCIES = [
    { value: 'WEEKLY', label: 'Weekly', discount: 15, desc: 'Same day every week' },
    { value: 'BIWEEKLY', label: 'Every 2 Weeks', discount: 10, desc: 'Twice a month' },
    { value: 'MONTHLY', label: 'Monthly', discount: 5, desc: 'Once a month' },
];

const DAYS = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' },
];

const TIME_SLOTS = [
    { value: '08:00-11:00', label: '8:00 AM - 11:00 AM' },
    { value: '11:00-14:00', label: '11:00 AM - 2:00 PM' },
    { value: '14:00-17:00', label: '2:00 PM - 5:00 PM' },
    { value: '17:00-20:00', label: '5:00 PM - 8:00 PM' },
];

export function RecurringSetup({
    serviceTypeId,
    addressId,
    bedrooms,
    bathrooms,
    hasPets,
    specialInstructions,
    onSuccess,
    onSkip,
}: RecurringSetupProps) {
    const [frequency, setFrequency] = useState('');
    const [preferredDay, setPreferredDay] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [recurringData, setRecurringData] = useState<any>(null);

    const selectedFrequency = FREQUENCIES.find(f => f.value === frequency);

    const handleSubmit = async () => {
        if (!frequency || !preferredDay || !preferredTime) {
            toast.error('Please select all options');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/recurring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceTypeId,
                    addressId,
                    bedrooms,
                    bathrooms,
                    hasPets,
                    specialInstructions,
                    frequency,
                    preferredDay,
                    preferredTime,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to set up recurring booking');
            }

            setSuccess(true);
            setRecurringData(data);
            toast.success(data.message || 'Recurring booking set up!');
            onSuccess?.(data.recurring);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to set up recurring booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success && recurringData) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800">Recurring Cleaning Set Up!</h3>
                        <p className="text-center text-green-700">
                            You'll save <strong>{recurringData.discountPercent}%</strong> on every cleaning.
                        </p>
                        {recurringData.nextBookingDate && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Next cleaning: {new Date(recurringData.nextBookingDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-blue-500" />
                    Set Up Recurring Cleaning
                </CardTitle>
                <CardDescription>
                    Save money by scheduling regular cleanings. Cancel anytime!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Frequency Selection */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">How often?</Label>
                    <div className="grid gap-3">
                        {FREQUENCIES.map((freq) => (
                            <div
                                key={freq.value}
                                onClick={() => setFrequency(freq.value)}
                                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    frequency === freq.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div>
                                    <p className="font-medium">{freq.label}</p>
                                    <p className="text-sm text-gray-500">{freq.desc}</p>
                                </div>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <Percent className="w-3 h-3 mr-1" />
                                    {freq.discount}% OFF
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day & Time Selection */}
                {frequency && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Preferred Day</Label>
                            <Select value={preferredDay} onValueChange={setPreferredDay}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map((day) => (
                                        <SelectItem key={day.value} value={day.value}>
                                            {day.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Preferred Time</Label>
                            <Select value={preferredTime} onValueChange={setPreferredTime}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((slot) => (
                                        <SelectItem key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Summary */}
                {frequency && preferredDay && preferredTime && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-blue-900">
                            {selectedFrequency?.label} on {DAYS.find(d => d.value === preferredDay)?.label}s
                        </p>
                        <p className="text-sm text-blue-700">
                            Time: {TIME_SLOTS.find(t => t.value === preferredTime)?.label}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                            You save {selectedFrequency?.discount}% on every cleaning!
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {onSkip && (
                        <Button variant="outline" onClick={onSkip} className="flex-1">
                            Skip for Now
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={!frequency || !preferredDay || !preferredTime || isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            <>
                                <CalendarClock className="w-4 h-4 mr-2" />
                                Set Up Recurring
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
