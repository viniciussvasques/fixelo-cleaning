import { prisma } from '@fixelo/database';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Eye, User, FileText } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye },
    BACKGROUND_CHECK: { label: 'Background Check', color: 'bg-purple-100 text-purple-800', icon: FileText },
    DOCUMENTS_NEEDED: { label: 'Documents Needed', color: 'bg-orange-100 text-orange-800', icon: FileText },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default async function CleanerReviewQueuePage() {
    const applications = await prisma.cleanerProfile.findMany({
        where: {
            onboardingCompleted: true,
        },
        include: {
            user: true,
            references: true,
        },
        orderBy: [
            { verificationStatus: 'asc' }, // PENDING first
            { submittedAt: 'asc' },
        ],
    });

    const pendingCount = applications.filter(a => a.verificationStatus === 'PENDING').length;
    const approvedCount = applications.filter(a => a.verificationStatus === 'APPROVED').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cleaner Applications</h1>
                    <p className="text-muted-foreground">Review and approve cleaner registrations</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
                        <div className="text-xs text-yellow-600">Pending</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
                        <div className="text-xs text-green-600">Approved</div>
                    </div>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No applications yet</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Applicant</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Submitted</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">References</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Docs</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {applications.map((app) => {
                                const status = statusConfig[app.verificationStatus] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                const verifiedRefs = app.references.filter(r => r.verified).length;

                                return (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                                                    {app.user.firstName?.[0]}{app.user.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {app.user.firstName} {app.user.lastName}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{app.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {app.submittedAt ? format(new Date(app.submittedAt), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${verifiedRefs === app.references.length && app.references.length > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                                                {verifiedRefs}/{app.references.length} verified
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {app.idDocumentUrl && (
                                                    <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center" title="ID Uploaded">
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                    </span>
                                                )}
                                                {app.hasInsurance && (
                                                    <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center" title="Insured">
                                                        <CheckCircle className="w-3 h-3 text-blue-600" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/users/cleaner/${app.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
