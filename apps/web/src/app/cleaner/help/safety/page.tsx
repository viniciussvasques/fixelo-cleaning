import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SafetyPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/cleaner/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Safety Guidelines</h1>
                    <p className="text-gray-500">Your safety is our priority</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Safety Best Practices
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Before the Job
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li>Review customer ratings and reviews</li>
                            <li>Confirm address and contact information</li>
                            <li>Share your work schedule with a trusted contact</li>
                            <li>Ensure your phone is fully charged</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            During the Job
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li>Keep your phone accessible at all times</li>
                            <li>Take before and after photos for protection</li>
                            <li>Stay in common areas when possible</li>
                            <li>Trust your instincts - leave if you feel unsafe</li>
                            <li>Document any damages or issues immediately</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-4 h-4" />
                            If You Feel Unsafe
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                            <li><strong>Immediate danger:</strong> Call 911</li>
                            <li><strong>Uncomfortable situation:</strong> Leave immediately and contact support</li>
                            <li><strong>Report incidents:</strong> Document everything and file a report</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Emergency Contacts
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Emergency:</strong> 911</p>
                            <p><strong>Fixelo Support:</strong> <a href="tel:+1800FIXELO" className="text-blue-600 hover:underline">1-800-FIXELO</a></p>
                            <p><strong>Email:</strong> <a href="mailto:safety@fixelo.app" className="text-blue-600 hover:underline">safety@fixelo.app</a></p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 text-blue-800">Insurance Coverage</h3>
                        <p className="text-sm text-blue-700">
                            All Fixelo cleaners are covered by liability insurance for incidents that occur during jobs.
                            This includes property damage and personal injury protection.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Link href="/cleaner/support" className="flex-1">
                    <Button variant="outline" className="w-full">Back to Support</Button>
                </Link>
                <Link href="/cleaner/support/new" className="flex-1">
                    <Button variant="destructive" className="w-full">Report Safety Issue</Button>
                </Link>
            </div>
        </div>
    );
}
