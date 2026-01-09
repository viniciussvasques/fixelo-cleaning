import { format } from 'date-fns';
import Link from 'next/link';

interface BookingCardProps {
    booking: {
        id: string;
        serviceType: {
            name: string;
            slug: string;
        };
        scheduledDate: Date | string;
        timeWindow: string;
        status: string;
        totalPrice: number;
        addressSnapshot: {
            street: string;
            city: string;
            state?: string;
            zipCode?: string;
        };
    };
}

export function BookingCard({ booking }: BookingCardProps) {
    const date = new Date(booking.scheduledDate);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800'; // PENDING, etc
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{booking.serviceType.name}</h3>
                        <p className="text-sm text-gray-500">
                            Booked on {format(new Date(), 'MMM d, yyyy')}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                    </span>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-start text-sm">
                        <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                            <p className="font-medium text-gray-900">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-gray-500">{booking.timeWindow}</p>
                        </div>
                    </div>

                    <div className="flex items-start text-sm">
                        <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-gray-700">
                            {booking.addressSnapshot?.street}, {booking.addressSnapshot?.city}
                        </p>
                    </div>

                    <div className="flex items-center text-sm">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-gray-900">${booking.totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex gap-3">
                    {booking.status === 'DRAFT' ? (
                        <Link
                            href={`/book/checkout?bookingId=${booking.id}`}
                            className="flex-1 bg-primary text-primary-foreground text-center py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Complete Booking
                        </Link>
                    ) : (
                        <button className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                            View Details
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}
