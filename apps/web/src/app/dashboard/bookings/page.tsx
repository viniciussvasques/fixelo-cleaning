import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, BOOKING_STATUS } from '@/lib/constants';
import { Calendar } from 'lucide-react';

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      serviceType: true,
      address: true,
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
    orderBy: { scheduledDate: 'desc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage all your cleaning service bookings
        </p>
      </div>

      {/* Bookings Table/List */}
      {bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title="No bookings yet"
            description="You haven't booked any cleaning services yet. Start by booking your first service!"
            action={
              <Link href="/book" className="btn btn-primary">
                Book Your First Cleaning
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {formatDate(booking.scheduledDate)}
                      <div className="text-xs text-muted-foreground">
                        {booking.timeWindow}
                      </div>
                    </TableCell>
                    <TableCell>{booking.serviceType.name}</TableCell>
                    <TableCell>
                      {booking.address ? (
                        <div className="text-sm">
                          <div>{booking.address.street}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.address.city}, {booking.address.state}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={(BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.variant || 'default') as 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline'}
                      >
                        {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.assignments && booking.assignments[0] ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                            {booking.assignments[0].cleaner.user.firstName?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {booking.assignments[0].cleaner.user.firstName} {booking.assignments[0].cleaner.user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ★ {booking.assignments[0].cleaner.rating.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(booking.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">{booking.serviceType.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(booking.scheduledDate)} • {booking.timeWindow}
                    </div>
                  </div>
                  <Badge variant={(BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.variant || 'default') as 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline'}>
                    {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label || booking.status}
                  </Badge>
                </div>
                {booking.address && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {booking.address.street}, {booking.address.city}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  {booking.assignments && booking.assignments[0] ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">
                        {booking.assignments[0].cleaner.user.firstName?.[0] || 'C'}
                      </div>
                      <span className="text-sm">
                        {booking.assignments[0].cleaner.user.firstName} {booking.assignments[0].cleaner.user.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No cleaner yet</span>
                  )}
                  <span className="font-semibold">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
