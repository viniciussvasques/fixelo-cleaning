import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Package,
  CheckCircle,
  Loader2,
  XCircle,
  Sparkles,
  MessageCircle,
  Star,
  LifeBuoy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof CheckCircle; color: string }> = {
  DRAFT: { label: 'Draft', variant: 'secondary', icon: Loader2, color: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'Pending', variant: 'default', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  ASSIGNED: { label: 'Cleaner Assigned', variant: 'default', icon: Package, color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Confirmed', variant: 'default', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Loader2, color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Completed', variant: 'outline', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary', icon: XCircle, color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Refunded', variant: 'secondary', icon: XCircle, color: 'bg-orange-100 text-orange-700' },
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  const [bookings, user] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        serviceType: true,
        assignments: {
          where: { status: 'ACCEPTED' },
          include: {
            cleaner: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true }
    })
  ]);

  const upcomingBookings = bookings.filter(b =>
    ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status) &&
    new Date(b.scheduledDate) >= new Date()
  );

  const pastBookings = bookings.filter(b =>
    ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(b.status) ||
    new Date(b.scheduledDate) < new Date()
  ).slice(0, 5);

  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const nextBooking = upcomingBookings[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.firstName || 'there'}! 👋
            </h1>
            <p className="text-blue-100 mt-2">
              {upcomingBookings.length > 0
                ? `You have ${upcomingBookings.length} upcoming cleaning${upcomingBookings.length > 1 ? 's' : ''}`
                : 'Ready to book your next cleaning?'
              }
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Book New Cleaning
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{upcomingBookings.length}</p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{completedCount}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <Link href="/dashboard/messages" className="bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow">
          <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-1" />
          <p className="text-sm text-gray-500">Messages</p>
        </Link>
        <Link href="/dashboard/support" className="bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow">
          <LifeBuoy className="w-8 h-8 text-orange-600 mx-auto mb-1" />
          <p className="text-sm text-gray-500">Get Support</p>
        </Link>
      </div>

      {/* Next Upcoming Booking */}
      {nextBooking && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Next Cleaning
            </h2>
          </div>
          <div className="p-6">
            <BookingCard booking={nextBooking} showActions />
          </div>
        </div>
      )}

      {/* Bookings Lists */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Upcoming Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Upcoming
            </h2>
            {upcomingBookings.length > 0 && (
              <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            )}
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No upcoming bookings</p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
              >
                Book a cleaning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <BookingCard key={booking.id} booking={booking} compact />
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-500 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Past Bookings
            </h2>
            {pastBookings.length > 0 && (
              <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            )}
          </div>

          {pastBookings.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center opacity-60">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No past bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3 opacity-75">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, compact = false, showActions = false }: { booking: any; compact?: boolean; showActions?: boolean }) {
  const status = statusConfig[booking.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;
  const address = booking.addressSnapshot as { street: string; city: string; state: string } | null;
  const assignedCleaner = booking.assignments?.[0]?.cleaner;

  if (compact) {
    return (
      <Link
        href={`/dashboard/bookings/${booking.id}`}
        className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow block"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{booking.serviceType?.name}</h3>
            <p className="text-sm text-gray-500">
              {format(new Date(booking.scheduledDate), 'MMM d')} • {booking.timeWindow}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-6">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
          <Package className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{booking.serviceType?.name}</h3>
          <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {booking.timeWindow}
            </span>
          </div>
          {address && (
            <p className="text-gray-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {address.street}, {address.city}
            </p>
          )}
          {assignedCleaner && (
            <p className="text-gray-600 mt-3 font-medium">
              Your Cleaner: {assignedCleaner.user?.firstName} {assignedCleaner.user?.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <Badge variant={status.variant} className={`flex items-center gap-1 px-3 py-1 ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </Badge>
        <p className="text-2xl font-bold text-gray-900">
          ${booking.totalPrice?.toFixed(2)}
        </p>
        {showActions && (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              View Details
            </Link>
            {assignedCleaner && (
              <Link
                href="/dashboard/messages"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
