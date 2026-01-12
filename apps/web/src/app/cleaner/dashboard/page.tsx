import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Calendar, DollarSign, MapPin, Clock, Briefcase, Star, TrendingUp, ArrowRight } from "lucide-react";
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
                            serviceType: true
                        }
                    }
                },
                orderBy: {
                    booking: { scheduledDate: 'asc' }
                },
                take: 3
            }
        }
    });

    if (!cleaner) {
        return (
            <div className="text-center py-16">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
                <p className="text-[var(--text-muted)] mb-6">You need to complete onboarding to start accepting jobs.</p>
                <Link href="/cleaner/onboarding" className="btn btn-primary">
                    Complete Onboarding
                </Link>
            </div>
        );
    }

    // Calculate real earnings from completed bookings
    const PROVIDER_SHARE = 0.83; // 83% goes to cleaner (platform 15% + insurance 2%)
    const completedBookings = await prisma.booking.findMany({
        where: {
            assignments: {
                some: {
                    cleanerId: cleaner.id,
                    status: AssignmentStatus.ACCEPTED
                }
            },
            status: BookingStatus.COMPLETED
        },
        select: { totalPrice: true }
    });

    const earnings = completedBookings.reduce((sum, b) => sum + (b.totalPrice * PROVIDER_SHARE), 0);

    const upcomingAssignments = cleaner.assignments.filter(a =>
        a.booking.status !== BookingStatus.COMPLETED && a.booking.status !== BookingStatus.CANCELLED
    );

    const stats = [
        { title: 'Total Earnings', value: formatCurrency(earnings), icon: DollarSign, color: 'primary' },
        { title: 'Acceptance Rate', value: `${(cleaner.acceptanceRate * 100).toFixed(0)}%`, icon: TrendingUp, color: 'accent' },
        { title: 'Quality Score', value: cleaner.qualityScore.toFixed(1), icon: Star, color: 'warning' },
        { title: 'Completed Jobs', value: cleaner.totalJobsCompleted.toString(), icon: Briefcase, color: 'primary' },
    ];


    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {session.user.name?.split(' ')[0]}!</h1>
                    <p className="text-[var(--text-secondary)]">Here's what's happening with your business today.</p>
                </div>
                <button className="btn btn-primary bg-[var(--accent)] hover:bg-[var(--accent-dark)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Go Online
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color === 'primary'
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                : stat.color === 'accent'
                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                    : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-[var(--text-muted)]">{stat.title}</div>
                    </div>
                ))}
            </div>

            {/* Upcoming Jobs */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Upcoming Schedule</h2>
                    <Link href="/cleaner/jobs" className="text-[var(--primary)] font-medium text-sm hover:underline flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {upcomingAssignments.length === 0 ? (
                    <div className="card p-8 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                        <p className="text-[var(--text-muted)]">No upcoming jobs scheduled.</p>
                        <Link href="/cleaner/jobs" className="text-[var(--primary)] font-medium text-sm mt-2 inline-block hover:underline">
                            Browse Available Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingAssignments.map((assignment) => (
                            <div key={assignment.id} className="card p-5 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Date Badge */}
                                    <div className="flex-shrink-0 flex flex-row md:flex-col items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl p-3 md:w-20 gap-2 md:gap-0">
                                        <span className="text-xs font-bold uppercase">
                                            {assignment.booking.scheduledDate.toLocaleDateString(undefined, { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-bold">
                                            {assignment.booking.scheduledDate.getDate()}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{assignment.booking.serviceType.name}</h3>
                                                <div className="flex items-center text-sm text-[var(--text-muted)] gap-2 mt-1">
                                                    <Clock className="w-4 h-4" />
                                                    {assignment.booking.timeWindow}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lg block">{formatCurrency(assignment.booking.totalPrice)}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${assignment.status === AssignmentStatus.ACCEPTED
                                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {assignment.status.toLowerCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {assignment.booking.address && (
                                            <div className="flex items-center text-sm text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                                                <MapPin className="w-4 h-4 mr-1 text-[var(--text-muted)]" />
                                                {assignment.booking.address.city}, {assignment.booking.address.state}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
