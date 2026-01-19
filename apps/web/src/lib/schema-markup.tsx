// JSON-LD Schema Markup Components for SEO
import { SEO_CONFIG } from './seo-config';

interface LocalBusinessSchemaProps {
    city: string;
    state: string;
}

export function generateLocalBusinessSchema({ city, state }: LocalBusinessSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SEO_CONFIG.siteUrl}/#organization`,
        name: SEO_CONFIG.siteName,
        image: `${SEO_CONFIG.siteUrl}/logo.svg`,
        url: SEO_CONFIG.siteUrl,
        telephone: SEO_CONFIG.phone,
        email: SEO_CONFIG.email,
        address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            addressRegion: state,
            addressCountry: 'US',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 28.5383,
            longitude: -81.3792,
        },
        areaServed: {
            '@type': 'City',
            name: city,
        },
        priceRange: '$109-$300',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '08:00',
                closes: '18:00',
            },
        ],
        sameAs: [
            'https://facebook.com/fixelo',
            'https://instagram.com/fixelo',
        ],
    };
}

interface ServiceSchemaProps {
    name: string;
    description: string;
    priceRange: string;
    city: string;
    url: string;
}

export function generateServiceSchema({ name, description, priceRange, city, url }: ServiceSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: name,
        description: description,
        provider: {
            '@type': 'LocalBusiness',
            name: SEO_CONFIG.siteName,
            url: SEO_CONFIG.siteUrl,
        },
        areaServed: {
            '@type': 'City',
            name: city,
        },
        serviceType: 'House Cleaning',
        offers: {
            '@type': 'Offer',
            priceSpecification: {
                '@type': 'PriceSpecification',
                priceCurrency: 'USD',
                price: priceRange,
            },
        },
        url: url,
    };
}

interface FAQSchemaProps {
    questions: Array<{ question: string; answer: string }>;
}

export function generateFAQSchema({ questions }: FAQSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: q.answer,
            },
        })),
    };
}

interface BreadcrumbSchemaProps {
    items: Array<{ name: string; url: string }>;
}

export function generateBreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

interface ReviewSchemaProps {
    reviews: Array<{
        author: string;
        rating: number;
        reviewBody: string;
        datePublished: string;
    }>;
}

export function generateAggregateRatingSchema({ reviews }: ReviewSchemaProps) {
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: SEO_CONFIG.siteName,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
            bestRating: '5',
            worstRating: '1',
        },
        review: reviews.map(r => ({
            '@type': 'Review',
            author: {
                '@type': 'Person',
                name: r.author,
            },
            reviewRating: {
                '@type': 'Rating',
                ratingValue: r.rating,
                bestRating: '5',
                worstRating: '1',
            },
            reviewBody: r.reviewBody,
            datePublished: r.datePublished,
        })),
    };
}

// Component to render JSON-LD in page
export function JsonLd({ data }: { data: object }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
