'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefundDialog } from '@/components/admin/RefundDialog';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import {
    ArrowLeft,
    User,
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    UserCheck,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';

interface BookingDetails {
    id: string;
    status: string;
    totalPrice: number;
    scheduledDate: string;
    timeWindow: string;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string; phone: string };
    serviceType: { name: string };
    address: { streetLine1: string; city: string; state: string; zipCode: string };
    payment?: { id: string; amount: number; status: string; stripePaymentIntentId: string };
    assignments: Array<{
        status: string;
        cleaner: { user: { firstName: string; lastName: string } };
    }>;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    ASSIGNED: { color: 'bg-blue-100 text-blue-800', icon: UserCheck },
    ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: UserCheck },
    IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: Loader2 },
    COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { color: 'bg-slate-100 text-slate-800', icon: XCircle },
    REFUNDED: { color: 'bg-red-100 text-red-800', icon: DollarSign },
    DISPUTED: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
};

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRefundDialog, setShowRefundDialog] = useState(false);

    const fetchBooking = async () => {
        try {
            const res = await fetch(`/api/admin/bookings/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
            } else {
                toast.error('Booking not found');
                router.push('/admin/bookings');
            }
        } catch (error) {
            console.error('Failed to fetch booking:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!booking) return null;

    const StatusIcon = STATUS_CONFIG[booking.status]?.icon || Clock;
    const canRefund = booking.payment?.status === 'SUCCEEDED' &&
        !['REFUNDED', 'CANCELLED'].includes(booking.status);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/bookings')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Booking Details</h1>
                    <p className="text-muted-foreground font-mono">{booking.id}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={STATUS_CONFIG[booking.status]?.color}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {booking.status}
                    </Badge>
                    {canRefund && (
                        <Button variant="destructive" onClick={() => setShowRefundDialog(true)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Issue Refund
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-lg font-semibold">
                                {booking.user.firstName} {booking.user.lastName}
                            </p>
                            <p className="text-muted-foreground">{booking.user.email}</p>
                            <p className="text-muted-foreground">{booking.user.phone}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="font-medium">{booking.serviceType.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium">
                                {format(new Date(booking.scheduledDate), 'PPP')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Time</span>
                            <span className="font-medium">{booking.timeWindow}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-bold text-lg">{formatCurrency(booking.totalPrice)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {booking.address ? (
                            <div>
                                <p>{booking.address.streetLine1}</p>
                                <p>{booking.address.city}, {booking.address.state} {booking.address.zipCode}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No address</p>
                        )}
                    </CardContent>
                </Card>

                {/* Payment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {booking.payment ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-medium">{formatCurrency(booking.payment.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={booking.payment.status === 'SUCCEEDED' ? 'success' : 'secondary'}>
                                        {booking.payment.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stripe ID</span>
                                    <span className="font-mono text-xs">{booking.payment.stripePaymentIntentId?.slice(0, 20)}...</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground">No payment recorded</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cleaner */}
                {booking.assignments.length > 0 && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5" />
                                Assigned Cleaner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {booking.assignments[0].cleaner.user.firstName?.[0] || 'C'}
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {booking.assignments[0].cleaner.user.firstName} {booking.assignments[0].cleaner.user.lastName}
                                    </p>
                                    <Badge variant="secondary">{booking.assignments[0].status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Refund Dialog */}
            {booking.payment && (
                <RefundDialog
                    isOpen={showRefundDialog}
                    onClose={() => setShowRefundDialog(false)}
                    onSuccess={fetchBooking}
                    bookingId={booking.id}
                    paymentId={booking.payment.id}
                    maxAmount={booking.payment.amount}
                    customerName={`${booking.user.firstName} ${booking.user.lastName}`}
                />
            )}
        </div>
    );
}
