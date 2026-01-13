import Link from 'next/link';
import { ArrowLeft, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CancellationPolicyPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/cleaner/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Cancellation Policy</h1>
                    <p className="text-gray-500">Understand our cancellation terms</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        Cleaner Cancellation Policy
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Cancellation Time Frames
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                            <li><strong>24+ hours before:</strong> No penalty - Full flexibility</li>
                            <li><strong>12-24 hours before:</strong> Warning issued - May affect rating</li>
                            <li><strong>Less than 12 hours:</strong> Penalty applied - Affects acceptance rate</li>
                            <li><strong>No-show:</strong> Serious penalty - May result in suspension</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
                            <XCircle className="w-4 h-4" />
                            Impact on Your Account
                        </h3>
                        <p className="text-sm text-yellow-700">
                            Multiple late cancellations or no-shows may result in:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 mt-2">
                            <li>Reduced job offers</li>
                            <li>Lower priority in job assignments</li>
                            <li>Temporary or permanent account suspension</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Emergency Situations</h3>
                        <p className="text-sm text-gray-600">
                            We understand emergencies happen. If you need to cancel due to an emergency (illness, family emergency, etc.),
                            please contact support immediately at <a href="mailto:support@fixelo.app" className="text-blue-600 hover:underline">support@fixelo.app</a>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Link href="/cleaner/support" className="flex-1">
                    <Button variant="outline" className="w-full">Back to Support</Button>
                </Link>
                <Link href="/cleaner/support/new" className="flex-1">
                    <Button className="w-full">Contact Support</Button>
                </Link>
            </div>
        </div>
    );
}
