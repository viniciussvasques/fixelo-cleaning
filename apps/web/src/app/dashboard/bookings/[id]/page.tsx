import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, Mail, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReviewForm from '@/components/booking/ReviewForm';
import BookingDetailsClient from '@/components/dashboard/BookingDetailsClient';
import { formatCurrency, formatDate, BOOKING_STATUS } from '@/lib/constants';

interface Props {
  params: { id: string };
}

export default async function BookingDetailsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      serviceType: true,
      address: true,
      review: true,
      addOns: {
        include: {
          addOn: true,
        },
      },
      assignments: {
        where: { status: 'ACCEPTED' },
        include: {
          cleaner: {
            include: {
              user: true,
            },
          },
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    notFound();
  }

  const assignment = booking.assignments[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
            <p className="text-muted-foreground">Booking ID: #{booking.id.slice(0, 8)}</p>
          </div>
          <Badge variant={(BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.variant || 'default') as 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline'} className="text-sm px-3 py-1">
            {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label || booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Section */}
          {booking.status === 'COMPLETED' && !booking.review && (
            <ReviewForm bookingId={booking.id} />
          )}

          {booking.review && (
            <div className="card p-6 bg-yellow-50/50 border-yellow-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Your Review
              </h2>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < booking.review!.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              {booking.review.comment && (
                <p className="text-gray-700 italic">"{booking.review.comment}"</p>
              )}
            </div>
          )}

          {/* Service Details */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Service Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Service Type</label>
                <p className="font-semibold text-lg">{booking.serviceType.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.serviceType.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Time</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{booking.timeWindow}</span>
                  </div>
                </div>
              </div>

              {booking.addOns && booking.addOns.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Add-ons</label>
                  <div className="mt-2 space-y-2">
                    {booking.addOns.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <span className="font-medium">{item.addOn.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking.specialInstructions && (
                <div>
                  <label className="text-sm text-muted-foreground">Special Instructions</label>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">
                    {booking.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {booking.address && (
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Service Address</h2>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{booking.address.street}</p>
                  {booking.address.unit && (
                    <p className="text-sm text-muted-foreground">Apt/Unit: {booking.address.unit}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {booking.address.city}, {booking.address.state} {booking.address.zipCode}
                  </p>
                  {booking.address.accessInstructions && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Access:</strong> {booking.address.accessInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cleaner Info */}
          {assignment && (
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Your Cleaner</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl flex-shrink-0">
                  {assignment.cleaner.user.firstName?.[0] || 'C'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {assignment.cleaner.user.firstName} {assignment.cleaner.user.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>★ {assignment.cleaner.rating.toFixed(1)} rating</span>
                    <span>•</span>
                    <span>{assignment.cleaner.jobsCompleted} jobs completed</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {assignment.cleaner.user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{assignment.cleaner.user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{formatCurrency(booking.basePrice)}</span>
              </div>
              {booking.addOns && booking.addOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span className="font-medium">
                    {formatCurrency(booking.addOnsTotal)}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - usando componente client para funcionalidade */}
          <BookingDetailsClient 
            bookingId={booking.id} 
            status={booking.status}
            cleanerName={assignment?.cleaner?.user?.firstName || 'Your Cleaner'}
            scheduledDate={booking.scheduledDate}
            totalPrice={booking.totalPrice}
            tipAmount={(booking as any).tipAmount || 0}
          />
        </div>
      </div>
    </div>
  );
}
