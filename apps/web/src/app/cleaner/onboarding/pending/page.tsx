import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react';

export default async function PendingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const profile = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!profile) {
        redirect('/cleaner/onboarding');
    }

    // If approved, redirect to dashboard
    if (profile.verificationStatus === 'APPROVED') {
        redirect('/cleaner/dashboard');
    }

    const statusConfig: Record<string, { icon: typeof Clock; title: string; description: string; color: string }> = {
        PENDING: {
            icon: Clock,
            title: 'Application Submitted',
            description: 'Your application is in our review queue. We typically review within 24-48 hours.',
            color: 'text-yellow-600 bg-yellow-100',
        },
        UNDER_REVIEW: {
            icon: Clock,
            title: 'Under Review',
            description: 'Our team is currently reviewing your application. Please check back soon.',
            color: 'text-blue-600 bg-blue-100',
        },
        BACKGROUND_CHECK: {
            icon: Clock,
            title: 'Background Check in Progress',
            description: 'We are running a background verification. This usually takes 2-3 business days.',
            color: 'text-purple-600 bg-purple-100',
        },
        DOCUMENTS_NEEDED: {
            icon: XCircle,
            title: 'Additional Documents Needed',
            description: profile.rejectionReason || 'Please update your documents to proceed.',
            color: 'text-orange-600 bg-orange-100',
        },
        REJECTED: {
            icon: XCircle,
            title: 'Application Not Approved',
            description: profile.rejectionReason || 'Unfortunately, we were unable to approve your application at this time.',
            color: 'text-red-600 bg-red-100',
        },
    };

    const status = statusConfig[profile.verificationStatus] || statusConfig.PENDING;
    const StatusIcon = status.icon;

    return (
        <div className="text-center max-w-md mx-auto">
            <div className={`inline-flex p-4 rounded-full mb-6 ${status.color}`}>
                <StatusIcon className="w-12 h-12" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{status.title}</h1>
            <p className="text-slate-600 mb-8">{status.description}</p>

            {profile.verificationStatus === 'DOCUMENTS_NEEDED' && (
                <Link
                    href="/cleaner/onboarding/identity"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-8"
                >
                    Update Documents
                </Link>
            )}

            <div className="bg-slate-50 rounded-xl p-6 text-left">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    We'll notify you
                </h2>
                <p className="text-sm text-slate-600">
                    You'll receive an email at <strong>{session.user.email}</strong> as soon as your application is reviewed.
                </p>
            </div>

            <div className="mt-8">
                <Link
                    href="/"
                    className="text-slate-500 hover:text-slate-700 text-sm"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
}
