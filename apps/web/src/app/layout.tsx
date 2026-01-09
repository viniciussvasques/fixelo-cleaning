import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

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
  title: 'Fixelo - Professional Home Cleaning Services',
  description: 'Book trusted, professional home cleaning services in Orlando, FL. Easy online booking, vetted cleaners, satisfaction guaranteed.',
  keywords: ['home cleaning', 'house cleaning', 'Orlando cleaning', 'professional cleaners', 'maid service', 'deep cleaning'],
  authors: [{ name: 'Fixelo' }],
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Fixelo - Professional Home Cleaning Services',
    description: 'Book trusted, professional home cleaning services in Orlando, FL',
    url: 'https://fixelo.com',
    siteName: 'Fixelo',
    locale: 'en_US',
    type: 'website',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
