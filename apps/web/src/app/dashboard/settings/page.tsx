import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/dashboard/SettingsClient';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account preferences</p>
            </div>

            <SettingsClient />
        </div>
    );
}
