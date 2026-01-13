'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, RefreshCw, DollarSign, Loader2, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface QualityIssueFormProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    hoursRemaining?: number;
    onSuccess?: () => void;
}

const ISSUE_TYPES = [
    { value: 'INCOMPLETE', label: 'Incomplete Cleaning', desc: 'Some areas were not cleaned' },
    { value: 'POOR_QUALITY', label: 'Poor Quality', desc: 'Cleaning was not up to standard' },
    { value: 'DAMAGE', label: 'Property Damage', desc: 'Something was damaged during cleaning' },
    { value: 'NO_SHOW', label: 'No Show', desc: 'Cleaner did not arrive' },
    { value: 'OTHER', label: 'Other Issue', desc: 'Something else went wrong' },
];

const REQUEST_TYPES = [
    { value: 'RECLEAN', label: 'Free Re-clean', icon: RefreshCw, desc: 'We\'ll send another cleaner at no cost' },
    { value: 'PARTIAL_REFUND', label: 'Partial Refund', icon: DollarSign, desc: '30% refund to your payment method' },
    { value: 'FULL_REFUND', label: 'Full Refund', icon: DollarSign, desc: 'Complete refund (for severe issues)' },
];

export function QualityIssueForm({ isOpen, onClose, bookingId, hoursRemaining = 48, onSuccess }: QualityIssueFormProps) {
    const [step, setStep] = useState(1);
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [requestType, setRequestType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; refundAmount?: number } | null>(null);

    const handleSubmit = async () => {
        if (!issueType || !description || !requestType) {
            toast.error('Please fill in all fields');
            return;
        }

        if (description.length < 20) {
            toast.error('Please provide more detail (at least 20 characters)');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/quality-issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueType,
                    description,
                    requestType,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit issue');
            }

            setResult({
                success: true,
                message: data.message,
                refundAmount: data.refundAmount,
            });

            toast.success('Issue reported successfully');
            onSuccess?.();

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit issue');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setIssueType('');
        setDescription('');
        setRequestType('');
        setResult(null);
    };

    if (result?.success) {
        return (
            <Dialog open={isOpen} onOpenChange={() => { resetForm(); onClose(); }}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-center">Issue Reported</h3>
                        <p className="text-gray-600 text-center">{result.message}</p>
                        {result.refundAmount && (
                            <p className="text-lg font-semibold text-green-600">
                                Refund: ${result.refundAmount.toFixed(2)}
                            </p>
                        )}
                        <Button onClick={() => { resetForm(); onClose(); }}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Report a Quality Issue
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {hoursRemaining > 0 ? (
                            <span>{Math.round(hoursRemaining)} hours remaining to report</span>
                        ) : (
                            <span className="text-red-500">Reporting window has closed</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <Label className="text-base font-semibold">What went wrong?</Label>
                        <RadioGroup value={issueType} onValueChange={setIssueType}>
                            {ISSUE_TYPES.map((type) => (
                                <div
                                    key={type.value}
                                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        issueType === type.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setIssueType(type.value)}
                                >
                                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                                    <div>
                                        <Label htmlFor={type.value} className="font-medium cursor-pointer">
                                            {type.label}
                                        </Label>
                                        <p className="text-sm text-gray-500">{type.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>

                        <Button 
                            onClick={() => setStep(2)} 
                            disabled={!issueType}
                            className="w-full"
                        >
                            Continue
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="text-base font-semibold">Describe the issue</Label>
                            <p className="text-sm text-gray-500 mb-2">
                                Please provide details about what happened (min 20 characters)
                            </p>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe what went wrong..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {description.length}/20 minimum characters
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button 
                                onClick={() => setStep(3)} 
                                disabled={description.length < 20}
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 py-4">
                        <Label className="text-base font-semibold">How would you like us to resolve this?</Label>
                        <RadioGroup value={requestType} onValueChange={setRequestType}>
                            {REQUEST_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <div
                                        key={type.value}
                                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            requestType === type.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => setRequestType(type.value)}
                                    >
                                        <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                                        <Icon className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <Label htmlFor={type.value} className="font-medium cursor-pointer">
                                                {type.label}
                                            </Label>
                                            <p className="text-sm text-gray-500">{type.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </RadioGroup>

                        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                Back
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={!requestType || isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Issue'
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
