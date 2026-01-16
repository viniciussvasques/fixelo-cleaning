'use client';

import { signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LogoutButtonProps {
    className?: string;
    variant?: 'primary' | 'outline' | 'danger';
}

export function LogoutButton({ className = '', variant = 'danger' }: LogoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        await signOut({ callbackUrl: '/' });
    };

    const baseStyles = 'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors';

    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
        danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </>
            )}
        </button>
    );
}
