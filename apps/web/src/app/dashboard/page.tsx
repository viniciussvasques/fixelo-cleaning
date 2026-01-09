import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, ArrowRight, Package, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof CheckCircle }> = {
  DRAFT: { label: 'Draft', variant: 'secondary', icon: Loader2 },
  PENDING: { label: 'Pending', variant: 'default', icon: Clock },
  ASSIGNED: { label: 'Cleaner Assigned', variant: 'default', icon: Package },
  ACCEPTED: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Loader2 },
  COMPLETED: { label: 'Completed', variant: 'outline', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'secondary', icon: XCircle },
  REFUNDED: { label: 'Refunded', variant: 'secondary', icon: XCircle },
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  const bookings = await prisma.booking.findMany({
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
  });

  const upcomingBookings = bookings.filter(b =>
    ['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(b.status) &&
    new Date(b.scheduledDate) >= new Date()
  );

  const pastBookings = bookings.filter(b =>
    ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(b.status) ||
    new Date(b.scheduledDate) < new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage your cleaning appointments</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
            <p className="text-gray-500 mb-6">Book your first cleaning and it will appear here.</p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Book a Cleaning
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">Past Bookings</h2>
                <div className="space-y-4 opacity-75">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const status = statusConfig[booking.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;
  const address = booking.addressSnapshot as { street: string; city: string; state: string };
  const assignedCleaner = booking.assignments?.[0]?.cleaner;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          {/* Service & Date */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{booking.serviceType?.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {booking.timeWindow}
                </span>
              </div>
              {address && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {address.street}, {address.city}
                </p>
              )}
            </div>
          </div>

          {/* Assigned Cleaner */}
          {assignedCleaner && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Your Cleaner:</span>{' '}
                {assignedCleaner.user?.firstName} {assignedCleaner.user?.lastName}
              </p>
            </div>
          )}
        </div>

        {/* Status & Price */}
        <div className="flex md:flex-col items-center md:items-end gap-4">
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
          <p className="text-xl font-bold text-gray-900">
            ${booking.totalPrice?.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
