import { auth } from '@/lib/auth';
import { prisma } from '@fixelo/database';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/dashboard/ProfileClient';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        }
    });

    const addresses = await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { isDefault: 'desc' }
    });

    if (!user) {
        redirect('/auth/signin');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account information</p>
            </div>

            <ProfileClient user={user} addresses={addresses} />

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">Tip:</span> Keep your profile updated to ensure smooth service delivery.
                </p>
            </div>
        </div>
    );
}
