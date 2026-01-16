'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { TipModal } from '@/components/bookings/tip-modal';
import { QualityIssueForm } from '@/components/bookings/quality-issue-form';
import { CancellationModal } from '@/components/bookings/cancellation-modal';

interface BookingDetailsClientProps {
    bookingId: string;
    status: string;
    cleanerName?: string;
    scheduledDate?: Date;
    completedAt?: Date | null;
    totalPrice?: number;
    tipAmount?: number;
}

export default function BookingDetailsClient({
    bookingId,
    status,
    cleanerName = 'Your Cleaner',
    scheduledDate = new Date(),
    completedAt,
    totalPrice = 0,
    tipAmount = 0,
}: BookingDetailsClientProps) {
    const router = useRouter();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);
    const [showQualityModal, setShowQualityModal] = useState(false);

    const canCancel = !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status);
    const isCompleted = status === 'COMPLETED';
    const canTip = isCompleted && tipAmount === 0;

    // Calcular horas restantes para reportar (48h após conclusão)
    const calculateHoursRemaining = () => {
        if (!completedAt) return 48;
        const completedDate = new Date(completedAt);
        const deadline = new Date(completedDate.getTime() + 48 * 60 * 60 * 1000);
        const now = new Date();
        const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        return Math.max(0, hoursLeft);
    };

    const hoursRemaining = calculateHoursRemaining();
    const canReportIssue = isCompleted && hoursRemaining > 0;

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Actions</h3>

                <button
                    onClick={() => router.push('/book')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                    Book Again
                </button>

                {/* Tip Button - only for completed bookings */}
                {canTip && (
                    <button
                        onClick={() => setShowTipModal(true)}
                        className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Heart className="w-4 h-4" />
                        Leave a Tip
                    </button>
                )}

                {/* Already Tipped */}
                {isCompleted && tipAmount > 0 && (
                    <div className="w-full px-4 py-2 bg-pink-50 text-pink-700 rounded-md text-center text-sm">
                        <Heart className="w-4 h-4 inline mr-1 fill-pink-500" />
                        You tipped ${tipAmount.toFixed(2)}
                    </div>
                )}

                {/* Report Issue Button - only for completed bookings */}
                {canReportIssue && (
                    <button
                        onClick={() => setShowQualityModal(true)}
                        className="w-full px-4 py-2 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Report an Issue
                    </button>
                )}

                {/* Cancel Button */}
                {canCancel && (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full px-4 py-2 border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors"
                    >
                        Cancel Booking
                    </button>
                )}
            </div>

            {/* Tip Modal */}
            <TipModal
                isOpen={showTipModal}
                onClose={() => setShowTipModal(false)}
                bookingId={bookingId}
                cleanerName={cleanerName}
                onSuccess={handleSuccess}
            />

            {/* Quality Issue Modal */}
            <QualityIssueForm
                isOpen={showQualityModal}
                onClose={() => setShowQualityModal(false)}
                bookingId={bookingId}
                hoursRemaining={hoursRemaining}
                onSuccess={handleSuccess}
            />

            {/* Cancellation Modal */}
            <CancellationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                bookingId={bookingId}
                scheduledDate={scheduledDate}
                totalPrice={totalPrice}
                onSuccess={handleSuccess}
            />
        </>
    );
}
