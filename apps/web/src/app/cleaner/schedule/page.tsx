import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { BookingStatus, AssignmentStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
    MapPin, Clock, Calendar, ChevronRight, Navigation, Phone,
    CheckCircle, AlertCircle, Home
} from "lucide-react";

export default async function SchedulePage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!cleaner) return null;

    // Get financial settings dynamically
    const financialSettings = await prisma.financialSettings.findFirst();
    const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
    const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;
    const PROVIDER_SHARE = 1 - platformFeePercent - insuranceFeePercent;

    // Get all scheduled jobs
    const scheduledJobs = await prisma.cleanerAssignment.findMany({
        where: {
            cleanerId: cleaner.id,
            status: AssignmentStatus.ACCEPTED,
            booking: {
                status: { notIn: [BookingStatus.CANCELLED] }
            }
        },
        include: {
            booking: {
                include: {
                    serviceType: true,
                    address: true,
                    user: { select: { firstName: true, lastName: true, phone: true } }
                }
            }
        },
        orderBy: { booking: { scheduledDate: 'asc' } }
    });

    // Group by date
    const groupedJobs = scheduledJobs.reduce((acc, job) => {
        const dateKey = new Date(job.booking.scheduledDate).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(job);
        return acc;
    }, {} as Record<string, typeof scheduledJobs>);

    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();

    const getDateLabel = (dateStr: string) => {
        if (dateStr === today) return 'Today';
        if (dateStr === tomorrow) return 'Tomorrow';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const upcomingJobs = scheduledJobs.filter(j => j.booking.status !== BookingStatus.COMPLETED);
    const completedJobs = scheduledJobs.filter(j => j.booking.status === BookingStatus.COMPLETED);

    // Calculate weekly earnings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekJobs = upcomingJobs.filter(j => new Date(j.booking.scheduledDate) >= startOfWeek);
    const weeklyEarnings = thisWeekJobs.reduce((sum, j) => sum + (j.booking.totalPrice * PROVIDER_SHARE), 0);

    return (
        <div className="space-y-6">
            {/* Week Summary */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
                <h2 className="text-sm font-medium opacity-90 mb-1">This Week</h2>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold">{thisWeekJobs.length}</p>
                        <p className="text-sm opacity-80">Jobs scheduled</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(weeklyEarnings)}</p>
                        <p className="text-sm opacity-80">Est. earnings</p>
                    </div>
                </div>
            </div>

            {/* Schedule Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <button className="flex-shrink-0 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Upcoming ({upcomingJobs.length})
                </button>
                <button className="flex-shrink-0 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                    Completed ({completedJobs.length})
                </button>
            </div>

            {/* Jobs by Date */}
            {Object.keys(groupedJobs).length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                    <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">No Jobs Scheduled</h3>
                    <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                        Your schedule is empty. Accept new jobs to start earning.
                    </p>
                    <Link href="/cleaner/jobs" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium">
                        <CheckCircle className="w-5 h-5" />
                        Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedJobs)
                        .filter(([_, jobs]) => jobs.some(j => j.booking.status !== BookingStatus.COMPLETED))
                        .map(([dateStr, jobs]) => {
                            const isToday = dateStr === today;
                            const upcomingOnly = jobs.filter(j => j.booking.status !== BookingStatus.COMPLETED);

                            return (
                                <div key={dateStr}>
                                    {/* Date Header */}
                                    <div className={`flex items-center gap-3 mb-3 sticky top-14 lg:top-0 py-2 bg-gray-50 -mx-4 px-4 lg:mx-0 lg:px-0 z-10 ${isToday ? 'text-green-700' : 'text-gray-700'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isToday ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                                            {new Date(dateStr).getDate()}
                                        </div>
                                        <div>
                                            <p className="font-bold">{getDateLabel(dateStr)}</p>
                                            <p className="text-xs text-gray-500">{upcomingOnly.length} job{upcomingOnly.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>

                                    {/* Jobs for this date */}
                                    <div className="space-y-3">
                                        {upcomingOnly.map(assignment => (
                                            <div key={assignment.id} className={`bg-white rounded-2xl overflow-hidden border ${isToday ? 'border-green-200 shadow-md' : 'border-gray-100'}`}>
                                                {/* Time Header */}
                                                <div className={`px-4 py-2 flex items-center justify-between ${isToday ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className={`w-4 h-4 ${isToday ? 'text-green-600' : 'text-gray-500'}`} />
                                                        <span className="font-medium text-sm">{assignment.booking.timeWindow}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">~{assignment.booking.estimatedDuration}min</span>
                                                </div>

                                                {/* Job Details */}
                                                <div className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-bold">{assignment.booking.serviceType.name}</h3>
                                                            <p className="text-sm text-gray-500 mt-0.5">
                                                                {assignment.booking.user.firstName} {assignment.booking.user.lastName}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-green-600">
                                                                {formatCurrency(assignment.booking.totalPrice * PROVIDER_SHARE)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {assignment.booking.address && (
                                                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                                                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                                            <div>
                                                                <p>{assignment.booking.address.street}</p>
                                                                <p className="text-gray-500">{assignment.booking.address.city}, {assignment.booking.address.state}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Property Details */}
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Home className="w-4 h-4" />
                                                            {assignment.booking.bedrooms} BR / {assignment.booking.bathrooms} BA
                                                        </div>
                                                        {assignment.booking.hasPets && (
                                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                                                                🐾 Has pets
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        {assignment.booking.address && (
                                                            <a
                                                                href={`https://maps.google.com/?q=${encodeURIComponent(`${assignment.booking.address.street}, ${assignment.booking.address.city}, ${assignment.booking.address.state}`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl font-medium text-sm"
                                                            >
                                                                <Navigation className="w-4 h-4" />
                                                                Navigate
                                                            </a>
                                                        )}
                                                        {assignment.booking.user.phone && (
                                                            <a
                                                                href={`tel:${assignment.booking.user.phone}`}
                                                                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-medium text-sm"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <Link
                                                            href={`/cleaner/jobs/${assignment.id}`}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm"
                                                        >
                                                            Details
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Pro Tips */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-800">Pro Tips</h3>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                            <li>• Arrive 5-10 minutes early for each job</li>
                            <li>• Take before & after photos for protection</li>
                            <li>• Contact the client if you're running late</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
