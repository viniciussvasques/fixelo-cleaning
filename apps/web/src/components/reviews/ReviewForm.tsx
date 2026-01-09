'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle } from 'lucide-react';

interface ReviewFormProps {
    bookingId: string;
    cleanerName: string;
    serviceName: string;
}

export function ReviewForm({ bookingId, cleanerName, serviceName }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    rating,
                    comment: comment.trim(),
                }),
            });

            if (!res.ok) throw new Error('Failed to submit review');

            setIsSubmitted(true);
            toast.success('Thank you for your review!');

            // Redirect after short delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardContent className="pt-12 pb-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                    <p className="text-muted-foreground">
                        Your review helps us improve our service.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Rate Your Experience</CardTitle>
                <p className="text-muted-foreground">
                    How was your {serviceName} with {cleanerName}?
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className={`p-1 transition-transform hover:scale-110 ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300'
                                }`}
                        >
                            <Star
                                className="w-10 h-10"
                                fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                            />
                        </button>
                    ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent!'}
                </p>

                {/* Comment */}
                <div className="space-y-2">
                    <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us more about your experience (optional)..."
                        rows={4}
                    />
                </div>

                {/* Submit */}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full"
                    size="lg"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Review'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
