'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

interface BookingDetailsClientProps {
    bookingId: string;
    status: string;
}

export default function BookingDetailsClient({ bookingId, status }: BookingDetailsClientProps) {
    const router = useRouter();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState('');

    const canCancel = status !== 'COMPLETED' && status !== 'CANCELLED';

    const handleCancel = async () => {
        if (cancelReason.trim().length < 10) {
            setError('Please provide a reason (minimum 10 characters)');
            return;
        }

        setError('');
        setIsCancelling(true);

        try {
            const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel booking');
            }

            setShowCancelModal(false);
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to cancel booking';
            setError(message);
        } finally {
            setIsCancelling(false);
        }
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

                {canCancel && (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full px-4 py-2 border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors"
                    >
                        Cancel Booking
                    </button>
                )}

                {status === 'COMPLETED' && (
                    <button
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
                    >
                        Leave a Review
                    </button>
                )}
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle className="h-6 w-6" />
                            <h2 className="text-xl font-semibold">Cancel Booking</h2>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cancellation Reason *
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                rows={4}
                                placeholder="Please tell us why you're cancelling..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setError('');
                                }}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
