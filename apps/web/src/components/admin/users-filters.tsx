'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';

interface UsersFiltersProps {
    totalUsers: number;
}

export function UsersFilters({ totalUsers }: UsersFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const currentRole = searchParams.get('role') || '';
    const currentStatus = searchParams.get('status') || '';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/admin/users?${createQueryString('search', search)}`);
    };

    const handleRoleChange = (role: string) => {
        router.push(`/admin/users?${createQueryString('role', role)}`);
    };

    const handleStatusChange = (status: string) => {
        router.push(`/admin/users?${createQueryString('status', status)}`);
    };

    const clearFilters = () => {
        setSearch('');
        router.push('/admin/users');
    };

    const hasFilters = search || currentRole || currentStatus;

    return (
        <div className="space-y-4 p-4 bg-white border rounded-lg">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="outline">Search</Button>
            </form>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-4">
                {/* Role Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <div className="flex gap-1">
                        {['', 'ADMIN', 'CLEANER', 'CUSTOMER'].map((role) => (
                            <Button
                                key={role}
                                variant={currentRole === role ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleRoleChange(role)}
                                className="text-xs"
                            >
                                {role || 'All'}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div className="flex gap-1">
                        {['', 'active', 'inactive'].map((status) => (
                            <Button
                                key={status}
                                variant={currentStatus === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(status)}
                                className="text-xs"
                            >
                                {status || 'All'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clear filters & count */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {totalUsers} users
                </span>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 gap-1">
                        <X className="w-3 h-3" />
                        Clear filters
                    </Button>
                )}
            </div>
        </div>
    );
}
