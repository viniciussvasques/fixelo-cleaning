import { DefaultSession } from 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: UserRole;
            referralCode: string | null;
            credits: number;
        } & DefaultSession['user'];
    }

    interface User {
        role: UserRole;
        referralCode?: string | null;
        credits?: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userId: string;
        role: UserRole;
        referralCode: string | null;
        credits: number;
    }
}
