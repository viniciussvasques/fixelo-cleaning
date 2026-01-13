import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@fixelo/database';
import { compare } from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('[AUTH] Authorize called with email:', credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log('[AUTH] Missing credentials');
                    return null;
                }

                // Using pure Prisma call here is fine as this file is Node-only
                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                        select: {
                            id: true,
                            email: true,
                            passwordHash: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            isActive: true,
                        },
                    });

                    console.log('[AUTH] User found:', user ? user.email : 'NOT FOUND');

                    if (!user || !user.isActive) {
                        console.log('[AUTH] User not found or inactive');
                        return null;
                    }

                    console.log('[AUTH] Comparing password...');
                    const isPasswordValid = await compare(
                        credentials.password as string,
                        user.passwordHash
                    );

                    console.log('[AUTH] Password valid:', isPasswordValid);

                    if (!isPasswordValid) return null;

                    console.log('[AUTH] Login successful for:', user.email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        role: user.role,
                        // referralCode: user.referralCode, // Waiting for Prisma Generate
                        // credits: user.credits, // Waiting for Prisma Generate
                    };
                } catch (error) {
                    console.error('[AUTH] Error in authorize:', error);
                    return null;
                }
            },
        })
    ]
});
