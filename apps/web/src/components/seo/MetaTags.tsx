import type { Metadata } from 'next';

interface SEOConfig {
    title: string;
    description: string;
    image?: string;
    url?: string;
    keywords?: string[];
}

const siteConfig = {
    name: 'Fixelo',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.com',
    defaultImage: '/og-image.png',
};

export function generateMetadata({
    title,
    description,
    image,
    url,
    keywords = [],
}: SEOConfig): Metadata {
    const fullTitle = title.includes('Fixelo') ? title : `${title} | Fixelo`;
    const imageUrl = image || siteConfig.defaultImage;
    const pageUrl = url || siteConfig.url;

    return {
        title: fullTitle,
        description,
        keywords: [
            'home cleaning',
            'house cleaning',
            'Orlando cleaning',
            'professional cleaners',
            'maid service',
            ...keywords,
        ],
        authors: [{ name: 'Fixelo' }],
        openGraph: {
            title: fullTitle,
            description,
            url: pageUrl,
            siteName: siteConfig.name,
            locale: 'en_US',
            type: 'website',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [imageUrl],
        },
        alternates: {
            canonical: pageUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

// Pre-defined metadata for common pages
export const pageMetadata = {
    home: generateMetadata({
        title: 'Fixelo - Professional Home Cleaning Services in Orlando',
        description:
            'Book trusted, professional home cleaning services in Orlando, FL. Easy online booking, vetted cleaners, satisfaction guaranteed. Starting at $109.',
        keywords: ['Orlando home cleaning', 'deep cleaning', 'maid service Orlando'],
    }),
    about: generateMetadata({
        title: 'About Us',
        description:
            'Learn about Fixelo, your trusted partner for professional home cleaning services in Orlando, FL. Our mission, story, and values.',
        url: `${siteConfig.url}/about`,
        keywords: ['about Fixelo', 'Orlando cleaning company'],
    }),
    becomeAPro: generateMetadata({
        title: 'Become a Pro Cleaner',
        description:
            'Join Fixelo and earn up to $1,250/week as a professional cleaner. Set your own schedule, get weekly payouts, and grow your business.',
        url: `${siteConfig.url}/become-a-pro`,
        keywords: ['cleaning jobs Orlando', 'become a cleaner', 'cleaning business'],
    }),
    contact: generateMetadata({
        title: 'Contact Us',
        description:
            'Get in touch with Fixelo. We\'re here to answer your questions about our professional home cleaning services in Orlando, FL.',
        url: `${siteConfig.url}/contact`,
        keywords: ['contact Fixelo', 'customer support'],
    }),
    terms: generateMetadata({
        title: 'Terms of Service',
        description:
            'Read Fixelo\'s Terms of Service. Understand your rights and responsibilities when using our home cleaning platform.',
        url: `${siteConfig.url}/terms`,
    }),
    privacy: generateMetadata({
        title: 'Privacy Policy',
        description:
            'Fixelo\'s Privacy Policy. Learn how we collect, use, and protect your personal information.',
        url: `${siteConfig.url}/privacy`,
    }),
    booking: generateMetadata({
        title: 'Book a Cleaning',
        description:
            'Book professional home cleaning in minutes. Choose your service, pick a time, and relax. Trusted cleaners, transparent pricing.',
        url: `${siteConfig.url}/book`,
        keywords: ['book cleaning', 'schedule cleaning', 'online booking'],
    }),
};

// JSON-LD Schema generators
export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Fixelo',
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: [],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-407-555-0123',
            contactType: 'customer service',
            areaServed: 'US',
            availableLanguage: ['English'],
        },
    };
}

export function generateLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': siteConfig.url,
        name: 'Fixelo - Professional Home Cleaning',
        image: `${siteConfig.url}/logo.png`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Orlando',
            addressRegion: 'FL',
            addressCountry: 'US',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 28.5383,
            longitude: -81.3792,
        },
        url: siteConfig.url,
        telephone: '+1-407-555-0123',
        priceRange: '$$',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '08:00',
                closes: '18:00',
            },
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '1000',
        },
    };
}

export function generateServiceSchema(serviceName: string, description: string, price: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName,
        description,
        provider: {
            '@type': 'Organization',
            name: 'Fixelo',
        },
        areaServed: {
            '@type': 'City',
            name: 'Orlando',
        },
        offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'USD',
        },
    };
}
