/**
 * Admin User Edit Page
 * 
 * Allows admins to view and edit user details, and delete users.
 */

import { notFound, redirect } from 'next/navigation';
import { prisma } from '@fixelo/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface Props {
    params: { id: string };
}

async function updateUserAction(formData: FormData) {
    'use server';

    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const id = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;
    const isActive = formData.get('isActive') === 'true';

    // Prevent self-demotion
    if (id === session.user.id && role !== 'ADMIN') {
        throw new Error("Cannot change your own admin role");
    }

    await prisma.user.update({
        where: { id },
        data: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            role: role as UserRole,
            isActive,
        },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    redirect('/admin/users');
}

async function deleteUserAction(formData: FormData) {
    'use server';

    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    const id = formData.get('id') as string;

    // Prevent self-deletion
    if (id === session.user.id) {
        throw new Error("Cannot delete your own account");
    }

    // Soft delete - deactivate user
    await prisma.user.update({
        where: { id },
        data: { isActive: false },
    });

    revalidatePath("/admin/users");
    redirect('/admin/users');
}

export default async function UserEditPage({ params }: Props) {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect('/');
    }

    const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            cleanerProfile: true,
            _count: { select: { bookings: true, reviews: true } }
        },
    });

    if (!user) {
        notFound();
    }

    const isSelf = session.user.id === user.id;

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Edit User</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>

            <form action={updateUserAction}>
                <input type="hidden" name="id" value={user.id} />

                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                        <CardDescription>
                            {user._count.bookings} bookings • {user._count.reviews} reviews
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input name="firstName" defaultValue={user.firstName} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input name="lastName" defaultValue={user.lastName} required />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" defaultValue={user.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input name="phone" type="tel" defaultValue={user.phone || ''} placeholder="+1234567890" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select name="role" defaultValue={user.role} disabled={isSelf}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                                        <SelectItem value="CLEANER">Cleaner</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isSelf && <p className="text-xs text-muted-foreground">Cannot change your own role</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select name="isActive" defaultValue={user.isActive ? 'true' : 'false'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4 border-t text-sm text-muted-foreground space-y-1">
                            <p><strong>ID:</strong> {user.id}</p>
                            <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                            {user.cleanerProfile && (
                                <p><strong>Cleaner Status:</strong> {user.cleanerProfile.status}</p>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" asChild>
                                <Link href="/admin/users">Cancel</Link>
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Danger Zone */}
            {!isSelf && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={deleteUserAction}>
                            <input type="hidden" name="id" value={user.id} />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Deactivate User</p>
                                    <p className="text-sm text-muted-foreground">
                                        User will be marked as inactive and unable to log in.
                                    </p>
                                </div>
                                <Button type="submit" variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Deactivate
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

