// Google Analytics 4 Event Tracking for Fixelo
// Implements booking funnel tracking, conversion events, and enhanced e-commerce

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}

// Check if gtag is available
const isGtagAvailable = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

// Generic event tracking
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
    if (!isGtagAvailable()) return;

    window.gtag!('event', eventName, params);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[GA4 Event]', eventName, params);
    }
}

// ==========================================
// BOOKING FUNNEL EVENTS
// ==========================================

interface ServiceSelectionParams {
    serviceType: string;
    serviceName: string;
    basePrice: number;
}

// When user selects a service type
export function trackServiceSelection({ serviceType, serviceName, basePrice }: ServiceSelectionParams) {
    trackEvent('select_content', {
        content_type: 'service',
        content_id: serviceType,
        item_name: serviceName,
        value: basePrice,
        currency: 'USD',
    });
}

interface HomeDetailsParams {
    bedrooms: number;
    bathrooms: number;
    homeType?: string;
}

// When user enters home details
export function trackHomeDetails({ bedrooms, bathrooms, homeType }: HomeDetailsParams) {
    trackEvent('view_item', {
        item_category: 'home_details',
        bedrooms,
        bathrooms,
        home_type: homeType,
    });
}

interface ScheduleParams {
    date: string;
    timeSlot: string;
}

// When user selects date/time
export function trackScheduleSelection({ date, timeSlot }: ScheduleParams) {
    trackEvent('add_to_cart', {
        item_category: 'schedule',
        date,
        time_slot: timeSlot,
    });
}

interface CheckoutParams {
    serviceType: string;
    serviceName: string;
    totalPrice: number;
    bedrooms: number;
    bathrooms: number;
    addons?: string[];
}

// When user reaches checkout
export function trackBeginCheckout({ serviceType, serviceName, totalPrice, bedrooms, bathrooms, addons }: CheckoutParams) {
    trackEvent('begin_checkout', {
        currency: 'USD',
        value: totalPrice,
        items: [{
            item_id: serviceType,
            item_name: serviceName,
            price: totalPrice,
            quantity: 1,
            item_category: 'cleaning_service',
            item_variant: `${bedrooms}bed_${bathrooms}bath`,
        }],
        addons: addons?.join(','),
    });
}

interface PurchaseParams {
    transactionId: string;
    serviceType: string;
    serviceName: string;
    totalPrice: number;
    bedrooms: number;
    bathrooms: number;
    addons?: string[];
    paymentMethod?: string;
}

// When booking is completed (CONVERSION EVENT)
export function trackPurchase({ transactionId, serviceType, serviceName, totalPrice, bedrooms, bathrooms, addons, paymentMethod }: PurchaseParams) {
    trackEvent('purchase', {
        transaction_id: transactionId,
        currency: 'USD',
        value: totalPrice,
        payment_type: paymentMethod,
        items: [{
            item_id: serviceType,
            item_name: serviceName,
            price: totalPrice,
            quantity: 1,
            item_category: 'cleaning_service',
            item_variant: `${bedrooms}bed_${bathrooms}bath`,
        }],
        addons: addons?.join(','),
    });

    // Also track as conversion
    trackEvent('conversion', {
        send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
        value: totalPrice,
        currency: 'USD',
        transaction_id: transactionId,
    });
}

// ==========================================
// CTA CLICK EVENTS
// ==========================================

interface CTAClickParams {
    buttonText: string;
    location: string;
    destination?: string;
}

// Track "Book Now" button clicks
export function trackBookNowClick({ buttonText, location, destination }: CTAClickParams) {
    trackEvent('book_now_click', {
        button_text: buttonText,
        click_location: location,
        destination: destination || '/book',
    });
}

// Track "Get Quote" button clicks
export function trackGetQuoteClick({ buttonText, location }: CTAClickParams) {
    trackEvent('get_quote_click', {
        button_text: buttonText,
        click_location: location,
    });
}

// Track phone call clicks
export function trackPhoneClick(phoneNumber: string, location: string) {
    trackEvent('phone_click', {
        phone_number: phoneNumber,
        click_location: location,
    });
}

// ==========================================
// PAGE VIEW EVENTS
// ==========================================

export function trackPageView(pagePath: string, pageTitle: string) {
    trackEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle,
    });
}

// ==========================================
// LEAD GENERATION EVENTS
// ==========================================

interface LeadParams {
    leadType: 'customer' | 'cleaner';
    source?: string;
}

// When user signs up
export function trackSignUp({ leadType, source }: LeadParams) {
    trackEvent('sign_up', {
        method: 'email',
        lead_type: leadType,
        source,
    });

    // Track as lead conversion
    trackEvent('generate_lead', {
        currency: 'USD',
        value: leadType === 'cleaner' ? 50 : 25, // Lead value estimate
        lead_type: leadType,
    });
}

// ==========================================
// ENGAGEMENT EVENTS
// ==========================================

// Track FAQ accordion opens
export function trackFAQOpen(question: string) {
    trackEvent('faq_open', {
        question,
    });
}

// Track review section views
export function trackReviewsView() {
    trackEvent('view_reviews', {
        content_type: 'reviews',
    });
}

// Track pricing table views
export function trackPricingView() {
    trackEvent('view_pricing', {
        content_type: 'pricing',
    });
}

// ==========================================
// ERROR TRACKING
// ==========================================

export function trackError(errorType: string, errorMessage: string, page?: string) {
    trackEvent('exception', {
        description: errorMessage,
        fatal: false,
        error_type: errorType,
        page,
    });
}

// ==========================================
// CUSTOM DIMENSIONS
// ==========================================

export function setUserProperties(properties: Record<string, string | number | boolean>) {
    if (!isGtagAvailable()) return;

    window.gtag!('set', 'user_properties', properties);
}

// Set user type (customer or cleaner)
export function setUserType(userType: 'customer' | 'cleaner' | 'admin') {
    setUserProperties({
        user_type: userType,
    });
}

// Set user city
export function setUserCity(city: string) {
    setUserProperties({
        user_city: city,
    });
}
