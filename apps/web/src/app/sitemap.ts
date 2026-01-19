import { MetadataRoute } from 'next';
import { CITIES, SERVICES } from '@/lib/seo-config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app';

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date().toISOString();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/book`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/pricing`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/reviews`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/become-a-pro`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/auth/signin`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/auth/signup`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // City pages (SEO local) - High priority for local SEO
    const cityPages: MetadataRoute.Sitemap = CITIES.map(city => ({
        url: `${BASE_URL}/house-cleaning-${city.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // Service + City combination pages
    const serviceCityPages: MetadataRoute.Sitemap = [];
    SERVICES.forEach(service => {
        CITIES.forEach(city => {
            serviceCityPages.push({
                url: `${BASE_URL}/${service.slug}-${city.slug}`,
                lastModified: currentDate,
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            });
        });
    });

    return [...staticPages, ...cityPages, ...serviceCityPages];
}
