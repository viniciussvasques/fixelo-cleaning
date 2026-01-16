'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Heart, DollarSign, Loader2, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { StripeProvider } from '@/components/providers/StripeProvider';
import { TipPaymentForm } from './TipPaymentForm';

interface TipModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    cleanerName: string;
    onSuccess?: () => void;
}

const TIP_PRESETS = [5, 10, 15, 20, 25, 50];

type ModalStep = 'SELECT' | 'PAYMENT' | 'SUCCESS';

export function TipModal({ isOpen, onClose, bookingId, cleanerName, onSuccess }: TipModalProps) {
    const [step, setStep] = useState<ModalStep>('SELECT');
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment state
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [confirmedAmount, setConfirmedAmount] = useState<number>(0);

    const tipAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

    const handleInitiateTip = async () => {
        if (!tipAmount || tipAmount < 1) {
            toast.error('Please select or enter a tip amount');
            return;
        }

        if (tipAmount > 500) {
            toast.error('Maximum tip amount is $500');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/tip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: tipAmount }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initiate tip');
            }

            if (data.requiresPayment && data.clientSecret) {
                setClientSecret(data.clientSecret);
                setConfirmedAmount(tipAmount);
                setStep('PAYMENT');
            } else {
                // Should not happen with new logic, but fallback just in case
                setStep('SUCCESS');
                toast.success('Tip sent successfully!');
                setTimeout(() => {
                    onSuccess?.();
                    handleClose();
                }, 2000);
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to initiate tip');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setIsSubmitting(true); // Re-use loading state for verification
        try {
            const res = await fetch(`/api/bookings/${bookingId}/tip/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to verify tip payment');
            }

            setStep('SUCCESS');
            toast.success('Tip sent successfully!');
            setTimeout(() => {
                onSuccess?.();
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('Tip verification error:', error);
            toast.error('Payment succeeded but verification failed. Please contact support.');
            // Even if verification fails visually, we probably shouldn't close immediately or we should show a specific error state.
            // For now, let's leave it open so they see the error.
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePresetClick = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomChange = (value: string) => {
        setCustomAmount(value);
        setSelectedAmount(null);
    };

    const handleClose = () => {
        onClose();
        // Reset state after transition
        setTimeout(() => {
            setStep('SELECT');
            setClientSecret(null);
            setSelectedAmount(null);
            setCustomAmount('');
        }, 300);
    };

    const handleBack = () => {
        setStep('SELECT');
        setClientSecret(null);
        setIsSubmitting(false);
    };

    if (step === 'SUCCESS') {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-center">Tip Sent!</h3>
                        <p className="text-gray-600 text-center">
                            ${(confirmedAmount || tipAmount)?.toFixed(2)} has been sent to {cleanerName}. Thank you for your generosity!
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {step === 'PAYMENT' && (
                        <div className="absolute left-4 top-4">
                            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <DialogTitle className="flex items-center justify-center gap-2 text-center pt-2">
                        {step === 'SELECT' ? (
                            <>
                                <Heart className="w-5 h-5 text-pink-500" />
                                Leave a Tip for {cleanerName}
                            </>
                        ) : (
                            'Secure Payment'
                        )}
                    </DialogTitle>
                    {step === 'SELECT' && (
                        <DialogDescription className="text-center">
                            100% of your tip goes directly to your cleaner.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {step === 'SELECT' && (
                    <>
                        <div className="space-y-4 py-4">
                            {/* Preset Amounts */}
                            <div className="grid grid-cols-3 gap-2">
                                {TIP_PRESETS.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handlePresetClick(amount)}
                                        className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${selectedAmount === amount
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    placeholder="Custom amount"
                                    value={customAmount}
                                    onChange={(e) => handleCustomChange(e.target.value)}
                                    min="1"
                                    max="500"
                                    step="0.01"
                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${customAmount ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}
                                />
                            </div>

                            {/* Summary */}
                            {tipAmount && tipAmount > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-gray-600">You're tipping</p>
                                    <p className="text-3xl font-bold text-gray-900">${tipAmount.toFixed(2)}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                                Maybe Later
                            </Button>
                            <Button
                                onClick={handleInitiateTip}
                                disabled={!tipAmount || tipAmount < 1 || isSubmitting}
                                className="bg-pink-500 hover:bg-pink-600"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-4 h-4 mr-2" />
                                        Call to Pay
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'PAYMENT' && clientSecret && (
                    <div className="py-2">
                        <StripeProvider clientSecret={clientSecret}>
                            <TipPaymentForm
                                bookingId={bookingId}
                                amount={confirmedAmount}
                                onSuccess={handlePaymentSuccess}
                                onCancel={handleBack}
                            />
                        </StripeProvider>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
