import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const session = req.auth;

    // Check maintenance mode
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    const maintenanceBypass = req.cookies.get('maintenance_bypass')?.value === 'true';

    // Allow certain paths during maintenance
    const isAllowedPath =
        nextUrl.pathname.startsWith('/maintenance') ||
        nextUrl.pathname.startsWith('/api/maintenance') ||
        nextUrl.pathname.startsWith('/admin') || // Admin can always access
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon') ||
        nextUrl.pathname.includes('.');

    if (isMaintenanceMode && !maintenanceBypass && !isAllowedPath) {
        // Check if user is admin (they can bypass)
        const isAdmin = session?.user?.role === 'ADMIN';
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/maintenance', nextUrl));
        }
    }

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

