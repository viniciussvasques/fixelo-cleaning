/**
 * Admin User Edit Page
 * 
 * Allows admins to view and edit user details.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@fixelo/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
    params: { id: string };
}

async function updateUser(formData: FormData) {
    'use server';

    const id = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const isActive = formData.get('isActive') === 'true';

    await prisma.user.update({
        where: { id },
        data: {
            firstName,
            lastName,
            email,
            role: role as 'CUSTOMER' | 'CLEANER' | 'ADMIN',
            isActive,
        },
    });
}

export default async function UserEditPage({ params }: Props) {
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: { cleanerProfile: true },
    });

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Link>
                </Button>
            </div>

            <h1 className="text-3xl font-bold">Edit User</h1>

            <form action={updateUser}>
                <input type="hidden" name="id" value={user.id} />

                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input name="firstName" defaultValue={user.firstName} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input name="lastName" defaultValue={user.lastName} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" defaultValue={user.email} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select name="role" defaultValue={user.role}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                                        <SelectItem value="CLEANER">Cleaner</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
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

                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                <strong>ID:</strong> {user.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            {user.cleanerProfile && (
                                <p className="text-sm text-muted-foreground">
                                    <strong>Cleaner Status:</strong> {user.cleanerProfile.status}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button variant="outline" asChild>
                                <Link href="/admin/users">Cancel</Link>
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
