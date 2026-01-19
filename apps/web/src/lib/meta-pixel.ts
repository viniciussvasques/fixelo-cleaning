// Meta Pixel (Facebook Pixel) Event Tracking for Fixelo
// Implements conversion tracking for Meta Ads campaigns

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

// Check if fbq is available
const isFbqAvailable = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

// Generic event tracking
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
    if (!isFbqAvailable()) return;

    window.fbq!('track', eventName, params);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Meta Pixel]', eventName, params);
    }
}

// Custom event tracking
export function trackMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
    if (!isFbqAvailable()) return;

    window.fbq!('trackCustom', eventName, params);

    if (process.env.NODE_ENV === 'development') {
        console.log('[Meta Pixel Custom]', eventName, params);
    }
}

// ==========================================
// STANDARD EVENTS
// ==========================================

interface ViewContentParams {
    contentType: string;
    contentName: string;
    contentId?: string;
    value?: number;
    currency?: string;
}

// ViewContent - When user views a service or page
export function metaViewContent({ contentType, contentName, contentId, value, currency = 'USD' }: ViewContentParams) {
    trackMetaEvent('ViewContent', {
        content_type: contentType,
        content_name: contentName,
        content_ids: contentId ? [contentId] : undefined,
        value,
        currency,
    });
}

interface AddToCartParams {
    contentType: string;
    contentName: string;
    contentId: string;
    value: number;
    currency?: string;
}

// AddToCart - When user adds service to booking
export function metaAddToCart({ contentType, contentName, contentId, value, currency = 'USD' }: AddToCartParams) {
    trackMetaEvent('AddToCart', {
        content_type: contentType,
        content_name: contentName,
        content_ids: [contentId],
        value,
        currency,
    });
}

interface InitiateCheckoutParams {
    contentType: string;
    contentName: string;
    contentIds: string[];
    value: number;
    numItems: number;
    currency?: string;
}

// InitiateCheckout - When user starts checkout
export function metaInitiateCheckout({ contentType, contentName, contentIds, value, numItems, currency = 'USD' }: InitiateCheckoutParams) {
    trackMetaEvent('InitiateCheckout', {
        content_type: contentType,
        content_name: contentName,
        content_ids: contentIds,
        value,
        currency,
        num_items: numItems,
    });
}

interface PurchaseParams {
    contentType: string;
    contentName: string;
    contentIds: string[];
    value: number;
    currency?: string;
}

// Purchase - When booking is completed (CONVERSION EVENT)
export function metaPurchase({ contentType, contentName, contentIds, value, currency = 'USD' }: PurchaseParams) {
    trackMetaEvent('Purchase', {
        content_type: contentType,
        content_name: contentName,
        content_ids: contentIds,
        value,
        currency,
    });
}

// ==========================================
// LEAD EVENTS
// ==========================================

interface LeadParams {
    contentName: string;
    value?: number;
    currency?: string;
}

// Lead - When user signs up
export function metaLead({ contentName, value, currency = 'USD' }: LeadParams) {
    trackMetaEvent('Lead', {
        content_name: contentName,
        value,
        currency,
    });
}

// CompleteRegistration - When user completes sign up
export function metaCompleteRegistration({ contentName, value, currency = 'USD' }: LeadParams) {
    trackMetaEvent('CompleteRegistration', {
        content_name: contentName,
        value,
        currency,
    });
}

// ==========================================
// SCHEDULING EVENTS (Custom)
// ==========================================

interface ScheduleParams {
    serviceType: string;
    date: string;
    timeSlot: string;
    value: number;
}

// Schedule - Custom event for booking date selection
export function metaSchedule({ serviceType, date, timeSlot, value }: ScheduleParams) {
    trackMetaCustomEvent('Schedule', {
        service_type: serviceType,
        date,
        time_slot: timeSlot,
        value,
        currency: 'USD',
    });
}
