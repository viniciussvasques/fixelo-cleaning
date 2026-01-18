import Link from "next/link";
import { prisma } from "@fixelo/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CleanerStatus, UserRole, Prisma } from "@prisma/client";
import { SendRemindersButton } from "@/components/admin/send-reminders-button";
import { UsersFilters } from "@/components/admin/users-filters";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

interface UsersPageProps {
    searchParams: {
        search?: string;
        role?: string;
        status?: string;
    };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const { search, role, status } = searchParams;

    // Build filter conditions
    const where: Prisma.UserWhereInput = {};

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (role && role !== '') {
        where.role = role as UserRole;
    }

    if (status === 'active') {
        where.isActive = true;
    } else if (status === 'inactive') {
        where.isActive = false;
    }

    // Cleaners pending approval (completed onboarding, waiting for admin review)
    const pendingCleaners = await prisma.cleanerProfile.findMany({
        where: { status: CleanerStatus.PENDING_APPROVAL },
        include: { user: true }
    });

    // Cleaners with incomplete onboarding
    const incompleteOnboarding = await prisma.cleanerProfile.findMany({
        where: {
            onboardingCompleted: false,
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    const users = await prisma.user.findMany({
        where,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { cleanerProfile: true }
    });


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

            {/* Filters */}
            <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-lg" />}>
                <UsersFilters totalUsers={users.length} />
            </Suspense>

            {/* Pending Approvals */}
            {pendingCleaners.length > 0 && (
                <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardHeader>
                        <CardTitle className="text-yellow-800 dark:text-yellow-200">
                            {pendingCleaners.length} Cleaners Connection Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors">
                                        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingCleaners.map((cleaner) => (
                                        <tr key={cleaner.id} className="border-b transition-colors">
                                            <td className="p-4 align-middle font-medium">{cleaner.user.firstName} {cleaner.user.lastName}</td>
                                            <td className="p-4 align-middle">{cleaner.user.email}</td>
                                            <td className="p-4 align-middle">{new Date(cleaner.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle text-right">
                                                <Button size="sm" asChild>
                                                    <Link href={`/admin/users/cleaner/${cleaner.id}`}>Review</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Incomplete Onboarding */}
            {incompleteOnboarding.length > 0 && (
                <Card className="border-orange-300 bg-orange-50 dark:bg-orange-900/10">
                    <CardHeader>
                        <CardTitle className="text-orange-800 dark:text-orange-200">
                            ⚠️ {incompleteOnboarding.length} Cleaners - Incomplete Onboarding
                        </CardTitle>
                        <CardDescription className="text-orange-700 dark:text-orange-300">
                            These cleaners started registration but haven&apos;t completed all steps
                        </CardDescription>
                        <div className="mt-3">
                            <SendRemindersButton count={incompleteOnboarding.length} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Step</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {incompleteOnboarding.map((cleaner) => (
                                        <tr key={cleaner.id} className="border-b">
                                            <td className="p-4 align-middle font-medium">{cleaner.user.firstName} {cleaner.user.lastName}</td>
                                            <td className="p-4 align-middle">{cleaner.user.email}</td>
                                            <td className="p-4 align-middle">
                                                <Badge className="bg-orange-100 text-orange-800">
                                                    Step {cleaner.onboardingStep} / 5
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">{new Date(cleaner.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle text-right">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/admin/users/cleaner/${cleaner.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{user.firstName} {user.lastName}</td>
                                        <td className="p-4 align-middle">{user.email}</td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === UserRole.ADMIN ? "bg-purple-100 text-purple-800" :
                                                user.role === UserRole.CLEANER ? "bg-blue-100 text-blue-800" :
                                                    "bg-gray-100 text-gray-800"
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                }`}>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/users/${user.id}`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
