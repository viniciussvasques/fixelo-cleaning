import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const session = req.auth;

    const isAuthenticated = !!session?.user;
    const userRole = session?.user?.role;

    console.log(`[Middleware] Path: ${nextUrl.pathname}, Auth: ${isAuthenticated}, Role: ${userRole}`);

    // Protect cleaner routes
    if (nextUrl.pathname.startsWith('/cleaner')) {
        if (!isAuthenticated || userRole !== 'CLEANER') {
            return NextResponse.redirect(new URL('/auth/signin', nextUrl));
        }
    }

    // Protect admin routes
    if (nextUrl.pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            // console.log(`[Middleware] Admin Access: Not Auth. Redirecting to /auth/signin`);
            return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/admin', nextUrl));
        }
        if (userRole !== 'ADMIN') {
            // console.log(`[Middleware] Admin Access: Wrong Role (${userRole}). Redirecting to /`);
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // Protect customer booking routes
    if (nextUrl.pathname.startsWith('/bookings') || nextUrl.pathname === '/book/address' || nextUrl.pathname === '/book/review') {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/book/auth', nextUrl)); // Redirect to our custom auth flow instead of generic signin
        }
    }

    // Redirect authenticated users from home to their dashboard
    if (nextUrl.pathname === '/' && isAuthenticated) {
        if (userRole === 'CLEANER') {
            return NextResponse.redirect(new URL('/cleaner/dashboard', nextUrl));
        } else if (userRole === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', nextUrl));
        } else if (userRole === 'CUSTOMER') {
            return NextResponse.redirect(new URL('/dashboard', nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/cleaner/:path*', '/admin/:path*', '/bookings/:path*', '/dashboard/:path*', '/book/address', '/book/review', '/'],
};

