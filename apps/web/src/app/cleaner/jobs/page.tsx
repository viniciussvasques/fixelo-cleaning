import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { BookingStatus, AssignmentStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default async function JobsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!cleaner) return null;

    // 1. Available Jobs (Paid bookings, Pending Assignment, within radius)
    // Normally strictly geo-filtered, simplifying for MVP to 'all assigned or pending' logic
    // For MVP: Show bookings with status PENDING (Paid, no cleaner yet)
    const availableJobs = await prisma.booking.findMany({
        where: {
            status: BookingStatus.PENDING,
            // In real world, filter by geo distance < cleaner.serviceRadius
        },
        include: {
            serviceType: true,
            address: true
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10
    });

    // 2. My Active Jobs
    const myJobs = await prisma.cleanerAssignment.findMany({
        where: {
            cleanerId: cleaner.id,
            status: { in: [AssignmentStatus.ACCEPTED, AssignmentStatus.PENDING] },
            booking: {
                status: { notIn: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] }
            }
        },
        include: {
            booking: {
                include: {
                    serviceType: true,
                    address: true
                }
            }
        },
        orderBy: { booking: { scheduledDate: 'asc' } }
    });

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Jobs & Opportunities</h1>

            {/* Available Jobs Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        New Opportunities <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{availableJobs.length}</span>
                    </h2>
                </div>

                {availableJobs.length === 0 ? (
                    <Card className="p-6 text-center text-gray-500 bg-gray-50 border-dashed">
                        <p>No new jobs available in your area right now.</p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {availableJobs.map(job => (
                            <Card key={job.id} className="p-4 border-l-4 border-l-green-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold">{job.serviceType.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {job.scheduledDate.toLocaleDateString()} • {job.timeWindow}
                                        </p>
                                    </div>
                                    <div className="font-bold text-green-600">
                                        {formatCurrency(job.totalPrice * 0.70)} {/* Est. 70% payout */}
                                    </div>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-4">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {job.address?.city || "Unknown Location"}
                                </div>
                                <Button className="w-full" asChild>
                                    <Link href={`/cleaner/jobs/${job.id}`}>View Details & Accept</Link>
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* My Schedule */}
            <section>
                <h2 className="text-lg font-semibold mb-4">My Schedule</h2>
                {myJobs.length === 0 ? (
                    <p className="text-gray-500">You have no active jobs.</p>
                ) : (
                    <div className="space-y-3">
                        {myJobs.map(assignment => (
                            <Card key={assignment.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded text-center min-w-[60px]">
                                        <span className="block text-xs font-bold uppercase text-gray-500">{assignment.booking.scheduledDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        <span className="block text-xl font-bold">{assignment.booking.scheduledDate.getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">{assignment.booking.serviceType.name}</h4>
                                        <p className="text-sm text-gray-500">{assignment.booking.timeWindow} • {assignment.booking.address?.street}</p>
                                    </div>
                                    <div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/cleaner/jobs/${assignment.bookingId}`}>Details</Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
