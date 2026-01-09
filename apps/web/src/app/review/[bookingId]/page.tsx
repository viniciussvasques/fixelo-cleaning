import { prisma } from '@fixelo/database';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { ReviewForm } from '@/components/reviews/ReviewForm';

interface ReviewPageProps {
    params: { bookingId: string };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/review/' + params.bookingId);
    }

    const booking = await prisma.booking.findUnique({
        where: { id: params.bookingId },
        include: {
            serviceType: true,
            assignments: {
                where: { status: 'ACCEPTED' },
                include: {
                    cleaner: {
                        include: { user: true }
                    }
                },
                take: 1,
            }
        }
    });

    if (!booking) {
        notFound();
    }

    // Verify belongs to user
    if (booking.userId !== (session.user as any).id) {
        redirect('/dashboard');
    }

    // Verify completed
    if (booking.status !== 'COMPLETED') {
        redirect('/dashboard');
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
        where: { bookingId: params.bookingId }
    });

    if (existingReview) {
        redirect('/dashboard?reviewed=true');
    }

    const cleanerName = booking.assignments[0]?.cleaner?.user
        ? `${booking.assignments[0].cleaner.user.firstName}`
        : 'your cleaner';

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="container mx-auto">
                <ReviewForm
                    bookingId={booking.id}
                    cleanerName={cleanerName}
                    serviceName={booking.serviceType.name}
                />
            </div>
        </main>
    );
}
