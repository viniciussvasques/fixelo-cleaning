import Link from 'next/link';
import { ArrowLeft, DollarSign, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentsHelpPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/cleaner/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Payment & Payouts</h1>
                    <p className="text-gray-500">How you get paid</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        How Payouts Work
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Payment Schedule
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Payouts are processed automatically every <strong>Friday</strong> for completed jobs from the previous week.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                            <strong>Example:</strong> Jobs completed Monday-Sunday are paid the following Friday.
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Earnings Breakdown
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li><strong>Your Share:</strong> 83% of booking price</li>
                            <li><strong>Platform Fee:</strong> 15%</li>
                            <li><strong>Insurance:</strong> 2%</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                            Fees cover payment processing, insurance, customer support, and platform maintenance.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Payment Methods</h3>
                        <p className="text-sm text-gray-600">
                            Payments are sent via Stripe Connect to your linked bank account or debit card.
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="w-4 h-4" />
                            Payment Delays
                        </h3>
                        <p className="text-sm text-yellow-700">
                            If you haven't received your payout, it may be due to:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 mt-2">
                            <li>Bank account not connected</li>
                            <li>Identity verification pending</li>
                            <li>Disputed transactions</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Link href="/cleaner/banking" className="flex-1">
                    <Button variant="outline" className="w-full">Banking Settings</Button>
                </Link>
                <Link href="/cleaner/earnings" className="flex-1">
                    <Button variant="outline" className="w-full">View Earnings</Button>
                </Link>
            </div>
        </div>
    );
}
