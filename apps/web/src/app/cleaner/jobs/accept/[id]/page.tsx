import { auth } from "@/lib/auth";
import { prisma } from "@fixelo/database";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Clock, Calendar, Home, Check, X } from "lucide-react";

interface PageProps {
    params: { id: string };
}

async function acceptBooking(bookingId: string, cleanerId: string) {
    "use server";

    // Create assignment and update booking status
    await prisma.$transaction(async (tx) => {
        // Create assignment
        await tx.cleanerAssignment.create({
            data: {
                booking: { connect: { id: bookingId } },
                cleaner: { connect: { id: cleanerId } },
                status: 'ACCEPTED',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            }
        });

        // Update booking status
        await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'ASSIGNED' }
        });
    });

    revalidatePath("/cleaner/jobs");
    revalidatePath("/cleaner/schedule");
    redirect("/cleaner/jobs");
}

export default async function AcceptBookingPage({ params }: PageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!cleaner || cleaner.status !== 'ACTIVE') {
        redirect("/onboarding/cleaner");
    }

    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: {
            serviceType: true,
            address: true,
            user: { select: { firstName: true } },
            assignments: true
        }
    });

    if (!booking) notFound();

    // Check if already assigned
    if (booking.assignments.length > 0) {
        redirect("/cleaner/jobs?error=already_claimed");
    }

    // Get financial settings
    const financialSettings = await prisma.financialSettings.findFirst();
    const platformFeePercent = financialSettings?.platformFeePercent ?? 0.15;
    const insuranceFeePercent = financialSettings?.insuranceFeePercent ?? 0.02;
    const PROVIDER_SHARE = 1 - platformFeePercent - insuranceFeePercent;
    const estimatedEarnings = booking.totalPrice * PROVIDER_SHARE;

    const getDateLabel = (date: Date) => {
        const isToday = new Date(date).toDateString() === new Date().toDateString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = new Date(date).toDateString() === tomorrow.toDateString();

        if (isToday) return 'Today';
        if (isTomorrow) return 'Tomorrow';
        return new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const acceptWithId = acceptBooking.bind(null, booking.id, cleaner.id);

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                    <h1 className="text-2xl font-bold mb-2">Claim This Job</h1>
                    <p className="text-green-100">This booking is available to all cleaners. Be the first to accept!</p>
                </div>

                {/* Job Details */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                                {getDateLabel(booking.scheduledDate)}
                            </span>
                            <h2 className="text-xl font-bold mt-2">{booking.serviceType.name}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(estimatedEarnings)}</p>
                            <p className="text-sm text-gray-500">Your earnings</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <Calendar className="w-5 h-5 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-semibold">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <Clock className="w-5 h-5 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-semibold">{booking.timeWindow}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <MapPin className="w-5 h-5 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-semibold">{booking.address?.city || 'TBD'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <Home className="w-5 h-5 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Size</p>
                            <p className="font-semibold">{booking.bedrooms} BR / {booking.bathrooms} BA</p>
                        </div>
                    </div>

                    {booking.specialInstructions && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-yellow-800 mb-1">Special Instructions</p>
                            <p className="text-sm text-yellow-700">{booking.specialInstructions}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <a
                            href="/cleaner/jobs"
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </a>
                        <form action={acceptWithId} className="flex-1">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                            >
                                <Check className="w-5 h-5" />
                                Accept Job
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
