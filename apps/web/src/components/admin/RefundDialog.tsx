'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, DollarSign, AlertTriangle } from 'lucide-react';

interface RefundDialogProps {
    bookingId: string;
    paymentId: string;
    maxAmount: number;
    customerName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RefundDialog({
    bookingId,
    paymentId,
    maxAmount,
    customerName,
    isOpen,
    onClose,
    onSuccess,
}: RefundDialogProps) {
    const [amount, setAmount] = useState(maxAmount);
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');

    const handleRefund = async () => {
        if (amount <= 0 || amount > maxAmount) {
            toast.error(`Amount must be between $0.01 and $${maxAmount.toFixed(2)}`);
            return;
        }

        if (!reason.trim()) {
            toast.error('Please provide a reason for the refund');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/admin/refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    paymentId,
                    amount: refundType === 'full' ? maxAmount : amount,
                    reason,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Refund failed');
            }

            toast.success(`Refund of $${(refundType === 'full' ? maxAmount : amount).toFixed(2)} processed successfully`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to process refund');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Process Refund
                    </DialogTitle>
                    <DialogDescription>
                        Refund payment for {customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Refund Type */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={refundType === 'full' ? 'default' : 'outline'}
                            onClick={() => {
                                setRefundType('full');
                                setAmount(maxAmount);
                            }}
                            className="flex-1"
                        >
                            Full Refund
                        </Button>
                        <Button
                            type="button"
                            variant={refundType === 'partial' ? 'default' : 'outline'}
                            onClick={() => setRefundType('partial')}
                            className="flex-1"
                        >
                            Partial Refund
                        </Button>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Refund Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={maxAmount}
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                disabled={refundType === 'full'}
                                className="pl-7"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Maximum refundable: ${maxAmount.toFixed(2)}
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label>Reason for Refund *</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Customer requested cancellation..."
                            rows={3}
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-800">This action cannot be undone</p>
                            <p className="text-amber-700">
                                The refund will be processed via Stripe and credited to the customer's original payment method.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleRefund} disabled={isProcessing} variant="destructive">
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Process Refund ${(refundType === 'full' ? maxAmount : amount).toFixed(2)}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
