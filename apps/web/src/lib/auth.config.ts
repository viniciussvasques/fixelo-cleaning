import type { NextAuthConfig, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';

export const authConfig = {
    providers: [], // Providers configured in auth.ts
    callbacks: {
        async jwt({ token, user }) {
            const extendedUser = user as (User & { role: UserRole, referralCode?: string | null, credits?: number });
            if (extendedUser) {
                token.role = extendedUser.role;
                token.userId = extendedUser.id as string;
                token.referralCode = extendedUser.referralCode || null;
                token.credits = extendedUser.credits || 0;
            }
            return token;
        },
        async session({ session, token }) {
            const extendedToken = token as JWT;
            if (session.user && extendedToken) {
                session.user.role = extendedToken.role;
                session.user.id = extendedToken.userId;
                session.user.referralCode = extendedToken.referralCode;
                session.user.credits = extendedToken.credits;
            }
            return session;
        },
        authorized({ auth: _auth, request: { nextUrl: _nextUrl } }) {
            return true; // Simple allow-all here, explicit protection in middleware function
        }
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
    },
    secret: "J/z+u72W6Q92j+8l5X+9d9d9d9d9d9d9d9d9d9d9d9=",
} satisfies NextAuthConfig;
