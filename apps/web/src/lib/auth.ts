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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Using pure Prisma call here is fine as this file is Node-only
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

                if (!user || !user.isActive) {
                    return null;
                }

                const isPasswordValid = await compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isPasswordValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    // referralCode: user.referralCode, // Waiting for Prisma Generate
                    // credits: user.credits, // Waiting for Prisma Generate
                };
            },
        })
    ]
});
