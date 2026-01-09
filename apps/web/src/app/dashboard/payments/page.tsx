import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PaymentMethodsClient from '@/components/dashboard/PaymentMethodsClient';

export default async function PaymentsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                <p className="text-gray-600 mt-2">Manage your payment options</p>
            </div>

            <PaymentMethodsClient />

            {/* Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
                <p className="text-sm text-gray-600">
                    Your payment information is encrypted and securely stored. We use Stripe to process all payments.
                </p>
            </div>
        </div>
    );
}
