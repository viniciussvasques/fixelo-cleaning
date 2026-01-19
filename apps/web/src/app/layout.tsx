import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { generateOrganizationSchema, generateLocalBusinessSchema } from '@/components/seo/MetaTags';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with useSession
const PushNotificationPrompt = dynamic(
  () => import('@/components/push-notification-prompt').then(mod => mod.PushNotificationPrompt),
  { ssr: false }
);

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fixelo.app'),
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
    url: 'https://fixelo.app',
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
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4QPSL99Z6N"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4QPSL99Z6N');
            `,
          }}
        />

        {/* Meta Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              if(!window._fbPixelInitialized){
                window._fbPixelInitialized=true;
                fbq('init', '1242796121071698');
                fbq('track', 'PageView');
              }
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1242796121071698&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {/* Structured Data */}
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
        <Providers>
          {children}
          <PushNotificationPrompt />
        </Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
