import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { BookingStatus, AssignmentStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { 
    MapPin, Clock, Calendar, ChevronRight, Briefcase, 
    AlertCircle, Sparkles, CheckCircle, Home, Timer
} from "lucide-react";

export default async function JobsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!cleaner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
                <p className="text-gray-500 mb-4">You need to complete onboarding first.</p>
                <Link href="/cleaner/onboarding" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium">
                    Start Onboarding
                </Link>
            </div>
        );
    }

    const PROVIDER_SHARE = 0.83;

    // Available Jobs (Pending assignments)
    const pendingAssignments = await prisma.cleanerAssignment.findMany({
        where: {
            cleanerId: cleaner.id,
            status: AssignmentStatus.PENDING,
            expiresAt: { gte: new Date() },
            booking: { status: BookingStatus.PENDING }
        },
        include: {
            booking: {
                include: {
                    serviceType: true,
                    address: true
                }
            }
        },
        orderBy: { booking: { scheduledDate: 'asc' } },
        take: 20
    });

    // My Active Jobs
    const myJobs = await prisma.cleanerAssignment.findMany({
        where: {
            cleanerId: cleaner.id,
            status: AssignmentStatus.ACCEPTED,
            booking: {
                status: { notIn: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] }
            }
        },
        include: {
            booking: {
                include: {
                    serviceType: true,
                    address: true,
                    user: { select: { firstName: true, lastName: true } }
                }
            }
        },
        orderBy: { booking: { scheduledDate: 'asc' } }
    });

    const getTimeRemaining = (expiresAt: Date) => {
        const diff = expiresAt.getTime() - Date.now();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m left`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m left`;
    };

    const isToday = (date: Date) => new Date(date).toDateString() === new Date().toDateString();
    const isTomorrow = (date: Date) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new Date(date).toDateString() === tomorrow.toDateString();
    };

    const getDateLabel = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex-shrink-0 bg-green-50 border border-green-100 rounded-xl p-3 min-w-[100px]">
                    <Sparkles className="w-5 h-5 text-green-600 mb-1" />
                    <p className="text-xl font-bold text-green-700">{pendingAssignments.length}</p>
                    <p className="text-xs text-green-600">Available</p>
                </div>
                <div className="flex-shrink-0 bg-blue-50 border border-blue-100 rounded-xl p-3 min-w-[100px]">
                    <Calendar className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="text-xl font-bold text-blue-700">{myJobs.length}</p>
                    <p className="text-xs text-blue-600">Scheduled</p>
                </div>
                <div className="flex-shrink-0 bg-purple-50 border border-purple-100 rounded-xl p-3 min-w-[100px]">
                    <CheckCircle className="w-5 h-5 text-purple-600 mb-1" />
                    <p className="text-xl font-bold text-purple-700">{cleaner.totalJobsCompleted}</p>
                    <p className="text-xs text-purple-600">Completed</p>
                </div>
            </div>

            {/* Available Jobs Section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        New Opportunities
                    </h2>
                    {pendingAssignments.length > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            {pendingAssignments.length} NEW
                        </span>
                    )}
                </div>

                {pendingAssignments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold mb-1">No Jobs Available</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            New jobs appear here when customers in your area book cleaning services.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingAssignments.map(assignment => (
                            <Link key={assignment.id} href={`/cleaner/jobs/${assignment.id}`}>
                                <div className="bg-white rounded-2xl p-4 border-l-4 border-l-green-500 border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {getDateLabel(assignment.booking.scheduledDate)}
                                                </span>
                                                {assignment.expiresAt && (
                                                    <span className="flex items-center gap-1 text-xs text-orange-600">
                                                        <Timer className="w-3 h-3" />
                                                        {getTimeRemaining(assignment.expiresAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-base">{assignment.booking.serviceType.name}</h3>
                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {assignment.booking.timeWindow}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-green-600">
                                                {formatCurrency(assignment.booking.totalPrice * PROVIDER_SHARE)}
                                            </p>
                                            <p className="text-xs text-gray-400">Est. earnings</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                            {assignment.booking.address?.city || "Location hidden"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Home className="w-4 h-4" />
                                            {assignment.booking.bedrooms}BR / {assignment.booking.bathrooms}BA
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 bg-green-50 text-green-700 py-2 px-4 rounded-xl text-center font-medium text-sm">
                                        View Details & Accept
                                        <ChevronRight className="w-4 h-4 inline ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* My Scheduled Jobs */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        My Schedule
                    </h2>
                    {myJobs.length > 0 && (
                        <Link href="/cleaner/schedule" className="text-green-600 text-sm font-medium">
                            View All
                        </Link>
                    )}
                </div>

                {myJobs.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No scheduled jobs yet</p>
                        <p className="text-xs text-gray-400 mt-1">Accept jobs above to fill your schedule</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myJobs.map(assignment => {
                            const jobDate = new Date(assignment.booking.scheduledDate);
                            const dateLabel = getDateLabel(jobDate);
                            const isJobToday = isToday(jobDate);
                            
                            return (
                                <Link key={assignment.id} href={`/cleaner/jobs/${assignment.id}`}>
                                    <div className={`bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all ${isJobToday ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-xl p-3 text-center min-w-[65px] ${isJobToday ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                <span className="block text-[10px] font-bold uppercase">
                                                    {jobDate.toLocaleDateString(undefined, { weekday: 'short' })}
                                                </span>
                                                <span className="block text-xl font-bold">{jobDate.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold truncate">{assignment.booking.serviceType.name}</h4>
                                                    {isJobToday && (
                                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            TODAY
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">{assignment.booking.timeWindow}</p>
                                                <p className="text-xs text-gray-400 truncate mt-1">
                                                    {assignment.booking.address?.street}, {assignment.booking.address?.city}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(assignment.booking.totalPrice * PROVIDER_SHARE)}
                                                </p>
                                                <ChevronRight className="w-5 h-5 text-gray-300 ml-auto mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Tips Section */}
            {myJobs.length === 0 && pendingAssignments.length === 0 && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-800">Tips to Get More Jobs</h3>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• Keep your acceptance rate above 80%</li>
                                <li>• Complete your profile with a photo</li>
                                <li>• Expand your service area in settings</li>
                                <li>• Be quick to accept new opportunities</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
