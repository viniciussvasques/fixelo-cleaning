import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/cleaner/',
                    '/dashboard/',
                    '/book/checkout',
                    '/book/success',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
