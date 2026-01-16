import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { BookingStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar, CheckCircle, Play } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { acceptJob, completeJob } from "../../actions";
import { ChatInterface } from "@/components/chat/chat-interface";
import Link from "next/link";

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const id = params.id;

    // Try to find by assignmentId first (from jobs list links)
    // Then fallback to bookingId (for direct links)
    let booking;
    let myAssignment;

    const assignment = await prisma.cleanerAssignment.findUnique({
        where: { id },
        include: {
            booking: {
                include: {
                    serviceType: true,
                    address: true
                }
            }
        }
    });

    if (assignment) {
        // Found by assignment ID
        booking = assignment.booking;
        myAssignment = assignment;
    } else {
        // Fallback: search by booking ID
        booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                serviceType: true,
                address: true,
                assignments: {
                    where: {
                        cleaner: { userId: session.user.id }
                    }
                }
            }
        });

        if (booking) {
            myAssignment = booking.assignments?.[0];
        }
    }

    if (!booking) notFound();

    // Determine view mode
    const isMyJob = !!myAssignment;
    const isAvailable = booking.status === BookingStatus.PENDING;

    // Actions - use assignment ID if available, otherwise booking ID
    const acceptAction = acceptJob.bind(null, myAssignment?.id || booking.id);
    const completeAction = completeJob.bind(null, myAssignment?.id || booking.id);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Job Details</h1>
                <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${isMyJob ? "bg-green-100 text-green-800" :
                        isAvailable ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}>
                        {isMyJob ? "ACCEPTED" : booking.status}
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-primary">{booking.serviceType.name}</h2>
                                <p className="font-bold text-lg">{formatCurrency(booking.totalPrice)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{booking.scheduledDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{booking.timeWindow}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{booking.address?.street}, {booking.address?.city}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">Home Details</h3>
                                <ul className="grid grid-cols-2 gap-2 text-sm">
                                    <li>{booking.bedrooms} Bedrooms</li>
                                    <li>{booking.bathrooms} Bathrooms</li>
                                    {booking.hasPets && <li>Has Pets 🐾</li>}
                                    {booking.squareFootage && <li>{booking.squareFootage} sq ft</li>}
                                </ul>
                            </div>

                            {booking.specialInstructions && (
                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold mb-2">Special Instructions</h3>
                                    <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-100">
                                        {booking.specialInstructions}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-gray-500">Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isAvailable && !isMyJob ? (
                                <form action={acceptAction}>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg">
                                        Accept Job
                                    </Button>
                                    <p className="text-xs text-center mt-2 text-gray-500">
                                        By accepting, you agree to fulfill this service request.
                                    </p>
                                </form>
                            ) : isMyJob ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-green-50 text-green-700 rounded text-center font-medium flex items-center justify-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> You accepted this job
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="font-semibold mb-2">Chat with Customer</h3>
                                        <ChatInterface bookingId={booking.id} currentUserId={session!.user!.id} />
                                    </div>

                                    {/* Always show Start Job button if job is accepted but not completed */}
                                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                        <Link href={`/cleaner/jobs/${params.id}/execute`} className="block mt-4">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg gap-2">
                                                <Play className="w-5 h-5" />
                                                {booking.status === 'IN_PROGRESS' ? 'Continue Job' : 'Start Job - Check In'}
                                            </Button>
                                        </Link>
                                    )}

                                    {booking.status === 'IN_PROGRESS' && (
                                        <form action={completeAction} className="mt-3">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700" variant="outline">
                                                Mark as Completed (Quick)
                                            </Button>
                                        </form>
                                    )}

                                    {booking.status !== 'COMPLETED' && (
                                        <form action={async () => {
                                            'use server';
                                            const { cancelJobByAssignmentId } = await import('../../actions');
                                            await cancelJobByAssignmentId(params.id);
                                        }}>
                                            <Button type="submit" className="w-full mt-4" variant="destructive">Cancel Job</Button>
                                        </form>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    This job is no longer available.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
