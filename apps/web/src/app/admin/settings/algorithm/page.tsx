'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RotateCcw, Sliders } from 'lucide-react';

interface AlgorithmWeights {
    match_weight_rating: number;
    match_weight_distance: number;
    match_weight_acceptance: number;
    match_weight_punctuality: number;
}

const DEFAULT_WEIGHTS: AlgorithmWeights = {
    match_weight_rating: 0.4,
    match_weight_distance: 0.2,
    match_weight_acceptance: 0.2,
    match_weight_punctuality: 0.2,
};

export default function AlgorithmSettingsPage() {
    const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchWeights();
    }, []);

    const fetchWeights = async () => {
        try {
            const res = await fetch('/api/admin/algorithm-weights');
            if (res.ok) {
                const data = await res.json();
                setWeights(data);
            }
        } catch (error) {
            console.error('Failed to fetch weights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate sum equals 1
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1) > 0.01) {
            toast.error(`Weights must sum to 1.0 (current: ${sum.toFixed(2)})`);
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/algorithm-weights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(weights),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast.success('Algorithm weights saved!');
        } catch (error) {
            toast.error('Failed to save weights');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setWeights(DEFAULT_WEIGHTS);
        toast.info('Reset to defaults (not saved yet)');
    };

    const updateWeight = (key: keyof AlgorithmWeights, value: string) => {
        const numValue = parseFloat(value) || 0;
        setWeights(prev => ({ ...prev, [key]: Math.max(0, Math.min(1, numValue)) }));
    };

    const total = Object.values(weights).reduce((a, b) => a + b, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Sliders className="w-8 h-8" />
                    Algorithm Weights
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure how cleaners are scored and matched to bookings
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Matching Score Weights</CardTitle>
                    <CardDescription>
                        These weights determine how each factor contributes to the final cleaner score.
                        Total must equal 1.0 (100%).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rating" className="flex justify-between">
                                <span>⭐ Rating Weight</span>
                                <span className="text-muted-foreground">{(weights.match_weight_rating * 100).toFixed(0)}%</span>
                            </Label>
                            <Input
                                id="rating"
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={weights.match_weight_rating}
                                onChange={(e) => updateWeight('match_weight_rating', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Higher = prefer cleaners with better ratings</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="distance" className="flex justify-between">
                                <span>📍 Distance Weight</span>
                                <span className="text-muted-foreground">{(weights.match_weight_distance * 100).toFixed(0)}%</span>
                            </Label>
                            <Input
                                id="distance"
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={weights.match_weight_distance}
                                onChange={(e) => updateWeight('match_weight_distance', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Higher = prefer cleaners closer to job location</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="acceptance" className="flex justify-between">
                                <span>✅ Acceptance Rate Weight</span>
                                <span className="text-muted-foreground">{(weights.match_weight_acceptance * 100).toFixed(0)}%</span>
                            </Label>
                            <Input
                                id="acceptance"
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={weights.match_weight_acceptance}
                                onChange={(e) => updateWeight('match_weight_acceptance', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Higher = prefer cleaners who accept more jobs</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="punctuality" className="flex justify-between">
                                <span>⏰ Punctuality Weight</span>
                                <span className="text-muted-foreground">{(weights.match_weight_punctuality * 100).toFixed(0)}%</span>
                            </Label>
                            <Input
                                id="punctuality"
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={weights.match_weight_punctuality}
                                onChange={(e) => updateWeight('match_weight_punctuality', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Higher = prefer cleaners who arrive on time</p>
                        </div>
                    </div>

                    {/* Total indicator */}
                    <div className={`p-4 rounded-lg ${Math.abs(total - 1) < 0.01 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Total</span>
                            <span className={`text-lg font-bold ${Math.abs(total - 1) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                                {(total * 100).toFixed(0)}%
                            </span>
                        </div>
                        {Math.abs(total - 1) >= 0.01 && (
                            <p className="text-sm text-red-600 mt-1">Weights must sum to 100%</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleReset} className="flex-1">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset to Defaults
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || Math.abs(total - 1) >= 0.01} className="flex-1">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Weights
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
