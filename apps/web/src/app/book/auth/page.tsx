import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BookingAuthForm } from '@/components/booking/booking-auth-form';

export default async function BookAuthPage() {
    const session = await auth();

    // If user is already logged in, skip auth step and go straight to address
    if (session?.user) {
        redirect('/book/address');
    }

    // Only show auth form for non-authenticated users
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Almost There!</h1>
                <p className="text-gray-600">Please identify yourself to secure your booking.</p>
            </div>

            <div className="w-full animate-in fade-in zoom-in duration-500">
                <BookingAuthForm />
            </div>
        </div>
    );
}
