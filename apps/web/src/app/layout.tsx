import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { generateOrganizationSchema, generateLocalBusinessSchema } from '@/components/seo/MetaTags';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.com'),
  title: {
    default: 'Fixelo - Professional Home Cleaning Services in Orlando',
    template: '%s | Fixelo',
  },
  description: 'Book trusted, professional home cleaning services in Orlando, FL. Easy online booking, vetted cleaners, satisfaction guaranteed. Starting at $109.',
  keywords: ['home cleaning', 'house cleaning', 'Orlando cleaning', 'professional cleaners', 'maid service', 'deep cleaning', 'Airbnb cleaning'],
  authors: [{ name: 'Fixelo' }],
  creator: 'Fixelo',
  publisher: 'Fixelo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Fixelo - Professional Home Cleaning Services',
    description: 'Book trusted, professional home cleaning services in Orlando, FL. Easy online booking, vetted cleaners.',
    url: 'https://fixelo.com',
    siteName: 'Fixelo',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fixelo - Professional Home Cleaning Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fixelo - Professional Home Cleaning Services',
    description: 'Book trusted, professional home cleaning services in Orlando, FL.',
    images: ['/og-image.png'],
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
