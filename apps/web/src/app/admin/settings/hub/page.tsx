import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign,
    Clock,
    Mail,
    Building2,
    Sliders,
    CreditCard,
    Settings,
    ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const settingsCategories = [
    {
        title: 'Platform Settings',
        description: 'General platform configuration',
        href: '/admin/settings',
        icon: Settings,
        color: 'bg-slate-100 text-slate-600',
    },
    {
        title: 'Algorithm Weights',
        description: 'Cleaner matching score configuration',
        href: '/admin/settings/algorithm',
        icon: Sliders,
        color: 'bg-purple-100 text-purple-600',
    },
    {
        title: 'Financial Settings',
        description: 'Fees, commissions, and pricing',
        href: '/admin/settings/financial',
        icon: CreditCard,
        color: 'bg-green-100 text-green-600',
    },
    {
        title: 'Payout Scheduling',
        description: 'Automatic payout configuration',
        href: '/admin/settings/payouts',
        icon: DollarSign,
        color: 'bg-emerald-100 text-emerald-600',
    },
    {
        title: 'Business Hours',
        description: 'Operating times and scheduling rules',
        href: '/admin/settings/scheduling',
        icon: Clock,
        color: 'bg-blue-100 text-blue-600',
    },
    {
        title: 'Email Settings',
        description: 'SMTP and email configuration',
        href: '/admin/settings/email',
        icon: Mail,
        color: 'bg-orange-100 text-orange-600',
    },
    {
        title: 'Company Info',
        description: 'Business details and contact',
        href: '/admin/settings/company',
        icon: Building2,
        color: 'bg-indigo-100 text-indigo-600',
    },
];

export default function SettingsHubPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage all platform configurations
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <Link key={category.href} href={category.href}>
                            <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-xl ${category.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-lg mb-1">{category.title}</CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
