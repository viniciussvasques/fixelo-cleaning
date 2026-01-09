'use client';

import { useState } from 'react';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
    bookingId: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit review');
            }

            setIsSubmitted(true);
            toast.success('Thank you for your feedback!');
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center animate-in fade-in zoom-in duration-300">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-900">Review Submitted!</h3>
                <p className="text-green-700 mt-2">Thank you for helping us improve our service.</p>
            </div>
        );
    }

    return (
        <div className="card p-6 bg-white shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Rate Your Service</h2>
            <p className="text-gray-600 mb-6">How was your experience with our cleaner?</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`h-10 w-10 ${star <= (hoverRating || rating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Feedback (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what you liked or how we can improve..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        rows={4}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                    {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                    Submit Review
                </button>
            </form>
        </div>
    );
}
