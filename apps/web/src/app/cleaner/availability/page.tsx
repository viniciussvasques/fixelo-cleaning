'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Save, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';

const DAYS = [
    { key: 'MONDAY', label: 'Monday' },
    { key: 'TUESDAY', label: 'Tuesday' },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY', label: 'Thursday' },
    { key: 'FRIDAY', label: 'Friday' },
    { key: 'SATURDAY', label: 'Saturday' },
    { key: 'SUNDAY', label: 'Sunday' },
];

const TIME_OPTIONS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

interface DayAvailability {
    isActive: boolean;
    startTime: string;
    endTime: string;
}

type AvailabilityMap = Record<string, DayAvailability>;

export default function AvailabilityPage() {
    const [availability, setAvailability] = useState<AvailabilityMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const res = await fetch('/api/cleaner/availability');
            if (res.ok) {
                const data = await res.json();
                setAvailability(data.availability);
            } else {
                toast.error('Failed to load availability');
            }
        } catch {
            toast.error('Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                isActive: !prev[day]?.isActive
            }
        }));
    };

    const updateTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const saveAvailability = async () => {
        setSaving(true);
        try {
            const availabilityArray = DAYS.map(day => ({
                dayOfWeek: day.key,
                startTime: availability[day.key]?.startTime || '09:00',
                endTime: availability[day.key]?.endTime || '17:00',
                isActive: availability[day.key]?.isActive || false,
            }));

            const res = await fetch('/api/cleaner/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability: availabilityArray })
            });

            if (res.ok) {
                toast.success('Availability saved successfully!');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save');
            }
        } catch {
            toast.error('Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Work Availability</h1>
                    <p className="text-gray-500 text-sm">Set your weekly schedule for receiving job offers</p>
                </div>
                <Link href="/cleaner/schedule" className="text-green-600 text-sm font-medium">
                    View Schedule →
                </Link>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900">How it works</p>
                        <p className="text-sm text-blue-700">
                            Select the days and hours you're available to work. You'll only receive
                            job offers during your available times.
                        </p>
                    </div>
                </div>
            </div>

            {/* Days List */}
            <div className="space-y-3">
                {DAYS.map(day => {
                    const dayData = availability[day.key] || { isActive: false, startTime: '09:00', endTime: '17:00' };
                    return (
                        <div
                            key={day.key}
                            className={`bg-white rounded-xl border p-4 transition-all ${dayData.isActive ? 'border-green-300 shadow-sm' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleDay(day.key)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${dayData.isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${dayData.isActive ? 'left-6' : 'left-0.5'
                                            }`} />
                                    </button>
                                    <span className={`font-medium ${dayData.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {day.label}
                                    </span>
                                </div>
                                {dayData.isActive ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <Check className="w-4 h-4" />
                                        Available
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <X className="w-4 h-4" />
                                        Not Available
                                    </span>
                                )}
                            </div>

                            {dayData.isActive && (
                                <div className="flex items-center gap-3 pl-15 ml-12">
                                    <select
                                        value={dayData.startTime}
                                        onChange={(e) => updateTime(day.key, 'startTime', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        {TIME_OPTIONS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                    <span className="text-gray-400">to</span>
                                    <select
                                        value={dayData.endTime}
                                        onChange={(e) => updateTime(day.key, 'endTime', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        {TIME_OPTIONS.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-4 pt-4">
                <button
                    onClick={saveAvailability}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Availability
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
