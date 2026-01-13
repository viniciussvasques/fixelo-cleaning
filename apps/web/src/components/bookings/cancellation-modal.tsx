'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, Check, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    scheduledDate: Date;
    totalPrice: number;
    onSuccess?: () => void;
}

export function CancellationModal({
    isOpen,
    onClose,
    bookingId,
    scheduledDate,
    totalPrice,
    onSuccess,
}: CancellationModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        refundAmount: number;
        cancellationFee: number;
    } | null>(null);

    // Calculate if late cancellation
    const hoursUntilService = (new Date(scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilService < 24;
    const cancellationFee = isLateCancellation ? totalPrice * 0.5 : 0;
    const refundAmount = totalPrice - cancellationFee;

    const handleSubmit = async () => {
        if (reason.length < 10) {
            toast.error('Please provide a reason (at least 10 characters)');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to cancel booking');
            }

            setResult({
                success: true,
                refundAmount: data.refundAmount,
                cancellationFee: data.cancellationFee,
            });

            toast.success('Booking cancelled');
            onSuccess?.();

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result?.success) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-center">Booking Cancelled</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4 w-full space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Original Amount</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            {result.cancellationFee > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Cancellation Fee</span>
                                    <span>-${result.cancellationFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-green-600 pt-2 border-t">
                                <span>Refund Amount</span>
                                <span>${result.refundAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            Your refund will be processed within 5-10 business days.
                        </p>

                        <Button onClick={onClose} className="w-full">Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Cancel Booking
                    </DialogTitle>
                    <DialogDescription>
                        {isLateCancellation ? (
                            <span className="text-orange-600">
                                Late cancellation fee applies (less than 24 hours notice)
                            </span>
                        ) : (
                            <span className="text-green-600">
                                Free cancellation - full refund available
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Time Until Service */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>
                            {hoursUntilService > 0 ? (
                                <>Service scheduled in {Math.round(hoursUntilService)} hours</>
                            ) : (
                                <>Service time has passed</>
                            )}
                        </span>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Booking Total</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        {isLateCancellation && (
                            <div className="flex justify-between text-orange-600">
                                <span className="flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    Late Cancellation Fee (50%)
                                </span>
                                <span>-${cancellationFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                            <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                Your Refund
                            </span>
                            <span className="text-green-600">${refundAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label>Reason for cancellation</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please tell us why you're cancelling..."
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-gray-400">
                            {reason.length}/10 minimum characters
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Keep Booking
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={reason.length < 10 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            'Confirm Cancellation'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
