import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'CLEANER') {
        return <div className="p-8">Unauthorized</div>;
    }

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notifications
            </h1>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No notifications yet.
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification) => {
                        const metadata = notification.metadata as { bookingId?: string } | null;
                        const link = metadata?.bookingId ? `/cleaner/jobs/${metadata.bookingId}` : '#';

                        return (
                            <Link href={link} key={notification.id} className="block group">
                                <Card className="transition-all hover:shadow-md border-l-4 border-l-primary/50 hover:border-l-primary">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="mt-1">
                                            {notification.status === 'SENT' ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                    {notification.subject}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {notification.body}
                                            </p>
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {notification.type}
                                                </Badge>
                                                {metadata?.bookingId && (
                                                    <Badge variant="outline" className="text-xs bg-primary/5">
                                                        Job Offer
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
