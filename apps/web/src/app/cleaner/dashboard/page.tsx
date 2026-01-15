import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
    Calendar, DollarSign, MapPin, Clock, Briefcase, Star,
    TrendingUp, ArrowRight, AlertCircle, CheckCircle, FileText,
    Navigation, Phone, ChevronRight, Sparkles, Target, Award
} from "lucide-react";
import { BookingStatus, AssignmentStatus } from "@prisma/client";

export default async function CleanerDashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            assignments: {
                where: {
                    status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PENDING] }
                },
                include: {
                    booking: {
                        include: {
                            address: true,
                            serviceType: true,
                            user: { select: { firstName: true, lastName: true, phone: true } }
                        }
                    }
                },
                orderBy: {
                    booking: { scheduledDate: 'asc' }
                },
                take: 5
            }
        }
    });

    if (!cleaner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <Briefcase className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
                <p className="text-gray-500 mb-6 max-w-sm">
                    You need to complete onboarding to start accepting jobs and earning money.
                </p>
                <Link
                    href="/cleaner/onboarding"
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                >
                    Complete Onboarding
                </Link>
            </div>
        );
    }

    // Calculate real earnings - Get fee settings from database
    const financialSettings = await prisma.financialSettings.findFirst();
    const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
    const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;
    const PROVIDER_SHARE = 1 - platformFeePercent - insuranceFeePercent; // e.g., 1 - 0.15 - 0.02 = 0.83

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [completedBookings, weeklyBookings, pendingJobs] = await Promise.all([
        prisma.booking.findMany({
            where: {
                assignments: { some: { cleanerId: cleaner.id, status: AssignmentStatus.ACCEPTED } },
                status: BookingStatus.COMPLETED
            },
            select: { totalPrice: true, updatedAt: true }
        }),
        prisma.booking.count({
            where: {
                assignments: { some: { cleanerId: cleaner.id, status: AssignmentStatus.ACCEPTED } },
                status: BookingStatus.COMPLETED,
                updatedAt: { gte: startOfWeek }
            }
        }),
        prisma.cleanerAssignment.count({
            where: {
                cleanerId: cleaner.id,
                status: AssignmentStatus.PENDING,
                expiresAt: { gte: new Date() },
                booking: { status: BookingStatus.PENDING }
            }
        })
    ]);

    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.totalPrice * PROVIDER_SHARE), 0);

    const upcomingAssignments = cleaner.assignments.filter(a =>
        a.booking.status !== BookingStatus.COMPLETED &&
        a.booking.status !== BookingStatus.CANCELLED &&
        a.status === AssignmentStatus.ACCEPTED
    );

    const nextJob = upcomingAssignments[0];
    const isToday = nextJob && new Date(nextJob.booking.scheduledDate).toDateString() === new Date().toDateString();

    // Verification Banner
    const VerificationBanner = () => {
        if (cleaner.verificationStatus === 'APPROVED') return null;

        const config: Record<string, { bg: string; icon: typeof AlertCircle; color: string; title: string; desc: string; action?: { label: string; href: string } }> = {
            PENDING: { bg: 'bg-amber-50', icon: Clock, color: 'text-amber-600', title: 'Verification Pending', desc: 'Your profile is under review.' },
            UNDER_REVIEW: { bg: 'bg-blue-50', icon: FileText, color: 'text-blue-600', title: 'Under Review', desc: 'Our team is reviewing your application.' },
            DOCUMENTS_NEEDED: {
                bg: 'bg-orange-50', icon: AlertCircle, color: 'text-orange-600',
                title: 'Documents Required',
                desc: cleaner.documentRequestReason || 'Please upload required documents.',
                action: { label: 'Upload Now', href: '/cleaner/onboarding/documents-needed' }
            },
            BACKGROUND_CHECK: { bg: 'bg-purple-50', icon: FileText, color: 'text-purple-600', title: 'Background Check', desc: 'Verification in progress (2-3 days).' },
        };

        const c = config[cleaner.verificationStatus] || config.PENDING;
        const Icon = c.icon;

        return (
            <div className={`${c.bg} rounded-2xl p-4 mb-6`}>
                <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${c.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{c.desc}</p>
                        {c.action && (
                            <Link href={c.action.href} className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${c.color}`}>
                                {c.action.label} <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-4">
            <VerificationBanner />

            {/* Quick Stats - Horizontal Scroll on Mobile */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 min-w-[140px] text-white shadow-lg shadow-green-600/20">
                    <DollarSign className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
                    <p className="text-xs opacity-80">Total Earned</p>
                </div>
                <div className="flex-shrink-0 bg-white rounded-2xl p-4 min-w-[120px] border border-gray-100 shadow-sm">
                    <Target className="w-6 h-6 mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{(cleaner.acceptanceRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">Acceptance</p>
                </div>
                <div className="flex-shrink-0 bg-white rounded-2xl p-4 min-w-[120px] border border-gray-100 shadow-sm">
                    <Star className="w-6 h-6 mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{cleaner.qualityScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="flex-shrink-0 bg-white rounded-2xl p-4 min-w-[120px] border border-gray-100 shadow-sm">
                    <Award className="w-6 h-6 mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{cleaner.totalJobsCompleted}</p>
                    <p className="text-xs text-gray-500">Jobs Done</p>
                </div>
            </div>

            {/* New Jobs Alert */}
            {pendingJobs > 0 && (
                <Link href="/cleaner/jobs" className="block">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{pendingJobs} New Job{pendingJobs > 1 ? 's' : ''}</p>
                                    <p className="text-sm opacity-90">Available in your area</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </div>
                </Link>
            )}

            {/* Next Job Card */}
            {nextJob && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {isToday ? 'Today' : new Date(nextJob.booking.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            {isToday && (
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    UPCOMING
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{nextJob.booking.serviceType.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {nextJob.booking.timeWindow} • ~{nextJob.booking.estimatedDuration}min
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-green-600">
                                    {formatCurrency(nextJob.booking.totalPrice * PROVIDER_SHARE)}
                                </p>
                                <p className="text-xs text-gray-400">Your earnings</p>
                            </div>
                        </div>

                        {nextJob.booking.address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{nextJob.booking.address.street}</p>
                                    <p className="text-gray-500">{nextJob.booking.address.city}, {nextJob.booking.address.state}</p>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            {nextJob.booking.address && (
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(`${nextJob.booking.address.street}, ${nextJob.booking.address.city}, ${nextJob.booking.address.state}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors"
                                >
                                    <Navigation className="w-4 h-4" />
                                    Navigate
                                </a>
                            )}
                            {nextJob.booking.user.phone && (
                                <a
                                    href={`tel:${nextJob.booking.user.phone}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call Client
                                </a>
                            )}
                            {isToday ? (
                                <Link
                                    href={`/cleaner/jobs/${nextJob.id}/execute`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                                >
                                    ▶ Start Job
                                </Link>
                            ) : (
                                <Link
                                    href={`/cleaner/jobs/${nextJob.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors"
                                >
                                    View Details
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming Schedule */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Upcoming Jobs</h2>
                    <Link href="/cleaner/schedule" className="text-green-600 text-sm font-medium flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {upcomingAssignments.length <= 1 && !nextJob ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 mb-2">No upcoming jobs scheduled</p>
                        <Link href="/cleaner/jobs" className="text-green-600 font-medium text-sm">
                            Browse Available Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingAssignments.slice(nextJob ? 1 : 0, 4).map((assignment) => (
                            <Link key={assignment.id} href={`/cleaner/jobs/${assignment.id}`}>
                                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.99]">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-50 text-green-600 rounded-xl p-3 text-center min-w-[60px]">
                                            <span className="block text-[10px] font-bold uppercase">
                                                {new Date(assignment.booking.scheduledDate).toLocaleDateString(undefined, { weekday: 'short' })}
                                            </span>
                                            <span className="block text-xl font-bold">
                                                {new Date(assignment.booking.scheduledDate).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold truncate">{assignment.booking.serviceType.name}</h4>
                                            <p className="text-sm text-gray-500">{assignment.booking.timeWindow}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(assignment.booking.totalPrice * PROVIDER_SHARE)}
                                            </p>
                                            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/cleaner/earnings" className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                        <p className="font-medium text-sm">View Earnings</p>
                        <p className="text-xs text-gray-500">Track your income</p>
                    </Link>
                    <Link href="/cleaner/banking" className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <DollarSign className="w-6 h-6 text-blue-600 mb-2" />
                        <p className="font-medium text-sm">Banking</p>
                        <p className="text-xs text-gray-500">Payout settings</p>
                    </Link>
                    <Link href="/cleaner/profile" className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
                        <p className="font-medium text-sm">My Profile</p>
                        <p className="text-xs text-gray-500">Edit your info</p>
                    </Link>
                    <Link href="/cleaner/support" className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
                        <p className="font-medium text-sm">Get Help</p>
                        <p className="text-xs text-gray-500">Support center</p>
                    </Link>
                </div>
            </div>

            {/* Verified Badge */}
            {cleaner.verificationStatus === 'APPROVED' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800">Verified Professional</p>
                        <p className="text-sm text-green-600">Background check passed • ID verified</p>
                    </div>
                </div>
            )}
        </div>
    );
}
