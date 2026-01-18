import { UserRole } from '@prisma/client';

// Status labels and colors
export const BOOKING_STATUS = {
    DRAFT: { label: 'Draft', variant: 'outline' as const },
    PENDING: { label: 'Pending', variant: 'warning' as const },
    ASSIGNED: { label: 'Assigned', variant: 'info' as const },
    ACCEPTED: { label: 'Accepted', variant: 'info' as const },
    IN_PROGRESS: { label: 'In Progress', variant: 'info' as const },
    COMPLETED: { label: 'Completed', variant: 'success' as const },
    CANCELLED: { label: 'Cancelled', variant: 'error' as const },
    REFUNDED: { label: 'Refunded', variant: 'outline' as const },
    DISPUTED: { label: 'Disputed', variant: 'warning' as const },
    RESOLVED: { label: 'Resolved', variant: 'success' as const },
} as const;

export const ASSIGNMENT_STATUS = {
    PENDING: { label: 'Pending', variant: 'warning' as const },
    ACCEPTED: { label: 'Accepted', variant: 'success' as const },
    REJECTED: { label: 'Rejected', variant: 'error' as const },
    COMPLETED: { label: 'Completed', variant: 'success' as const },
} as const;

// Navigation items for each role
export const CUSTOMER_NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/dashboard/bookings', label: 'My Bookings', icon: 'Calendar' },
    { href: '/dashboard/profile', label: 'Profile', icon: 'User' },
    { href: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const CLEANER_NAV_ITEMS = [
    { href: '/cleaner/dashboard', label: 'Home', icon: 'LayoutDashboard' },
    { href: '/cleaner/jobs', label: 'Jobs', icon: 'Briefcase' },
    { href: '/cleaner/schedule', label: 'Schedule', icon: 'CalendarDays' },
    { href: '/cleaner/profile', label: 'Profile', icon: 'UserCircle' },
] as const;

export const ADMIN_NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/admin/bookings', label: 'Bookings', icon: 'Calendar' },
    { href: '/admin/services', label: 'Services', icon: 'Package' },
    { href: '/admin/users', label: 'Users', icon: 'Users' },
    { href: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
    { href: '/admin/payments', label: 'Payments', icon: 'DollarSign' },
    { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const;

// Routes constants
export const ROUTES = {
    HOME: '/',
    BOOK: '/book',

    // Customer
    CUSTOMER_DASHBOARD: '/dashboard',
    CUSTOMER_BOOKINGS: '/dashboard/bookings',
    CUSTOMER_PROFILE: '/dashboard/profile',
    CUSTOMER_SETTINGS: '/dashboard/settings',

    // Cleaner
    CLEANER_DASHBOARD: '/cleaner/dashboard',
    CLEANER_JOBS: '/cleaner/jobs',
    CLEANER_SCHEDULE: '/cleaner/schedule',
    CLEANER_PROFILE: '/cleaner/profile',
    CLEANER_ONBOARDING: '/onboarding/cleaner',

    // Admin
    ADMIN_DASHBOARD: '/admin',
    ADMIN_BOOKINGS: '/admin/bookings',
    ADMIN_SERVICES: '/admin/services',
    ADMIN_USERS: '/admin/users',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_PAYMENTS: '/admin/payments',
    ADMIN_SETTINGS: '/admin/settings',

    // Auth
    SIGN_IN: '/auth/signin',
    SIGN_UP: '/auth/signup',
} as const;

// Default redirects by role
export const ROLE_REDIRECTS: Record<UserRole, string> = {
    [UserRole.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
    [UserRole.CLEANER]: ROUTES.CLEANER_DASHBOARD,
    [UserRole.ADMIN]: ROUTES.ADMIN_DASHBOARD,
};

// Format currency helper
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// Format date helper
export const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
};

// Format time helper
export const formatTime = (date: Date | string): string => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date));
};
