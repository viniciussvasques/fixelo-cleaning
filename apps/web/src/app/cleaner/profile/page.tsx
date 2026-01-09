import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { User, Mail, Phone, MapPin, Star, Briefcase, Calendar } from 'lucide-react';

export default async function CleanerProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const cleaner = await prisma.cleanerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            user: true,
            availability: true,
        },
    });

    if (!cleaner) {
        redirect('/cleaner/onboarding');
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">My Professional Profile</h1>
                <p className="text-muted-foreground">
                    Manage your professional information and availability
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Professional Information</h2>
                            <button className="btn btn-outline btn-sm">Edit</button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm text-muted-foreground">Full Name</label>
                                    <p className="font-medium">{cleaner.user.firstName} {cleaner.user.lastName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm text-muted-foreground">Email</label>
                                    <p className="font-medium">{cleaner.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm text-muted-foreground">Phone</label>
                                    <p className="font-medium">{cleaner.user.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <label className="text-sm text-muted-foreground">Service Radius</label>
                                    <p className="font-medium">
                                        {cleaner.serviceRadius} km radius
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services Accepted */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Services Accepted</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {cleaner.acceptsStandard && (
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                    Standard Cleaning
                                </span>
                            )}
                            {cleaner.acceptsDeep && (
                                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                                    Deep Cleaning
                                </span>
                            )}
                            {cleaner.acceptsAirbnb && (
                                <span className="px-3 py-1 bg-info/10 text-info rounded-full text-sm font-medium">
                                    Airbnb Cleaning
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Availability</h2>
                            <Link href="/cleaner/schedule" className="btn btn-outline btn-sm">
                                Manage Schedule
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {cleaner.availability && cleaner.availability.length > 0 ? (
                                cleaner.availability.slice(0, 5).map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {slot.dayOfWeek}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {slot.startTime} - {slot.endTime}
                                            </p>
                                        </div>
                                        <div className="text-sm">
                                            {slot.isActive ? (
                                                <span className="text-success">Active</span>
                                            ) : (
                                                <span className="text-muted-foreground">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    No availability set. Update your schedule to start receiving bookings.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="font-semibold mb-4">Performance Stats</h3>
                        <div className="space-y-4">
                            <div className="text-center p-4 bg-primary/10 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Star className="w-5 h-5 text-primary fill-primary" />
                                    <span className="text-3xl font-bold text-primary">
                                        {cleaner.rating.toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">Average Rating</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-accent/10 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Briefcase className="w-4 h-4 text-accent" />
                                        <span className="text-2xl font-bold text-accent">
                                            {cleaner.jobsCompleted}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Jobs Done</p>
                                </div>

                                <div className="text-center p-3 bg-info/10 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-info" />
                                        <span className="text-2xl font-bold text-info">
                                            {cleaner.availability?.filter(a => a.isActive).length || 0}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Available Slots</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="font-semibold mb-4">Account Status</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Member Since</span>
                                <span className="font-medium">
                                    {new Date(cleaner.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className={`font-medium ${cleaner.status === 'ACTIVE' ? 'text-success' : 'text-warning'}`}>
                                    {cleaner.status === 'ACTIVE' ? 'Active' : cleaner.status === 'PENDING_APPROVAL' ? 'Pending Review' : cleaner.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Verified</span>
                                <span className="font-medium">
                                    {cleaner.backgroundCheckStatus === 'APPROVED' ? '✓' : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link href="/cleaner/jobs" className="btn btn-primary w-full">
                                View Jobs
                            </Link>
                            <Link href="/cleaner/schedule" className="btn btn-outline w-full">
                                Manage Schedule
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
