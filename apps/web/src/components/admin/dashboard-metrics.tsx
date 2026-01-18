import { prisma } from "@fixelo/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CleanerStatus } from "@prisma/client";
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react";

export async function DashboardMetrics() {
    // Fetch all counts in parallel
    const [
        totalUsers,
        totalCleaners,
        activeCleaners,
        pendingCleaners,
        suspendedCleaners,
        incompleteOnboarding,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.cleanerProfile.count(),
        prisma.cleanerProfile.count({ where: { status: CleanerStatus.ACTIVE } }),
        prisma.cleanerProfile.count({ where: { status: CleanerStatus.PENDING_APPROVAL } }),
        prisma.cleanerProfile.count({ where: { status: { in: [CleanerStatus.SUSPENDED, CleanerStatus.DEACTIVATED] } } }),
        prisma.cleanerProfile.count({ where: { onboardingCompleted: false } }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalCleaners > 0
        ? Math.round((activeCleaners / totalCleaners) * 100)
        : 0;

    const metrics = [
        {
            title: "Total Users",
            value: totalUsers,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Active Cleaners",
            value: activeCleaners,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Pending Approval",
            value: pendingCleaners,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Incomplete Onboarding",
            value: incompleteOnboarding,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            title: "Suspended",
            value: suspendedCleaners,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
        {
            title: "Conversion Rate",
            value: `${conversionRate}%`,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            subtitle: "Approved / Total Cleaners",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric) => (
                <Card key={metric.title} className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {metric.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${metric.bgColor}`}>
                            <metric.icon className={`w-4 h-4 ${metric.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metric.color}`}>
                            {metric.value}
                        </div>
                        {metric.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {metric.subtitle}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
