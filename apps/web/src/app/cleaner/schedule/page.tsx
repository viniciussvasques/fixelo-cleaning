"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const DAYS = [
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
];

interface DayAvailability {
    active: boolean;
    start: string;
    end: string;
}

// Mock initial data
const INITIAL_AVAILABILITY = DAYS.reduce((acc, day) => {
    acc[day] = { active: true, start: "09:00", end: "17:00" };
    return acc;
}, {} as Record<string, DayAvailability>);

export default function SchedulePage() {
    const [availability, setAvailability] = useState(INITIAL_AVAILABILITY);

    const handleToggle = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], active: !prev[day].active }
        }));
    };

    const handleChange = (day: string, field: 'start' | 'end', value: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Weekly Schedule</h1>
                <Button>Save Changes</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Standard Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {DAYS.map((day) => (
                        <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-4 w-1/3">
                                <input
                                    type="checkbox"
                                    checked={availability[day].active}
                                    onChange={() => handleToggle(day)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label className="font-semibold capitalize">{day.toLowerCase()}</Label>
                            </div>

                            <div className={`flex items-center gap-2 flex-1 transition-opacity ${availability[day].active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                <Input
                                    type="time"
                                    value={availability[day].start}
                                    onChange={(e) => handleChange(day, 'start', e.target.value)}
                                    className="w-32"
                                />
                                <span>to</span>
                                <Input
                                    type="time"
                                    value={availability[day].end}
                                    onChange={(e) => handleChange(day, 'end', e.target.value)}
                                    className="w-32"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
