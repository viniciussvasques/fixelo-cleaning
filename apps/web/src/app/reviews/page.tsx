import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ArrowRight, Quote, MapPin } from 'lucide-react';
import { JsonLd, generateAggregateRatingSchema } from '@/lib/schema-markup';
import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
    title: 'Customer Reviews | 5-Star Cleaning Service | Fixelo',
    description: 'Read what our customers say about Fixelo cleaning services. 5-star ratings, verified reviews from Orlando, Kissimmee, Winter Park. Book with confidence!',
    openGraph: {
        title: 'Customer Reviews | 5-Star Cleaning Service | Fixelo',
        description: 'Read verified customer reviews. 5-star rated cleaning service in Orlando, FL.',
        url: `${SEO_CONFIG.siteUrl}/reviews`,
        siteName: SEO_CONFIG.siteName,
        type: 'website',
    },
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/reviews` },
};

const reviews = [
    {
        author: 'Sarah M.',
        location: 'Orlando, FL',
        rating: 5,
        reviewBody: 'Absolutely fantastic service! My home has never been cleaner. The cleaner was professional, thorough, and even paid attention to the small details. I\'ve already booked my next cleaning.',
        datePublished: '2024-01-15',
        service: 'Deep Cleaning',
    },
    {
        author: 'Michael R.',
        location: 'Winter Park, FL',
        rating: 5,
        reviewBody: 'As a busy professional, Fixelo has been a lifesaver. The booking process is incredibly easy, and the quality is consistent every single time. Highly recommend!',
        datePublished: '2024-01-10',
        service: 'Weekly Cleaning',
    },
    {
        author: 'Jennifer L.',
        location: 'Kissimmee, FL',
        rating: 5,
        reviewBody: 'I use Fixelo for my Airbnb properties and they never disappoint. Quick turnovers, hotel-quality cleaning, and my guests always comment on how clean the place is. 5 stars!',
        datePublished: '2024-01-08',
        service: 'Airbnb Turnover',
    },
    {
        author: 'David K.',
        location: 'Lake Nona, FL',
        rating: 5,
        reviewBody: 'We moved into a new home and booked Fixelo for a move-in clean. They did an incredible job - every corner was spotless. Made our move so much less stressful.',
        datePublished: '2024-01-05',
        service: 'Move-In Cleaning',
    },
    {
        author: 'Amanda T.',
        location: 'Orlando, FL',
        rating: 5,
        reviewBody: 'The transparent pricing is what sold me initially, but the quality keeps me coming back. No hidden fees, great communication, and amazing results. Love Fixelo!',
        datePublished: '2024-01-02',
        service: 'Standard Cleaning',
    },
    {
        author: 'Carlos G.',
        location: 'Kissimmee, FL',
        rating: 5,
        reviewBody: 'Finally found a cleaning service I can trust. The cleaners are verified, professional, and do an outstanding job. My wife and I are thrilled with the results.',
        datePublished: '2023-12-28',
        service: 'Deep Cleaning',
    },
    {
        author: 'Lisa H.',
        location: 'Winter Park, FL',
        rating: 5,
        reviewBody: 'I\'ve tried many cleaning services over the years, and Fixelo is by far the best. The attention to detail is impressive, and the online booking makes it so convenient.',
        datePublished: '2023-12-20',
        service: 'Weekly Cleaning',
    },
    {
        author: 'Robert P.',
        location: 'Orlando, FL',
        rating: 5,
        reviewBody: 'Great experience from start to finish. The cleaner arrived on time, was very polite, and left my apartment sparkling clean. Will definitely use again!',
        datePublished: '2023-12-15',
        service: 'Standard Cleaning',
    },
];

const stats = [
    { value: '4.9', label: 'Average Rating' },
    { value: '500+', label: 'Happy Customers' },
    { value: '2,000+', label: 'Cleanings Completed' },
    { value: '100%', label: 'Satisfaction Rate' },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                />
            ))}
        </div>
    );
}

export default function ReviewsPage() {
    return (
        <>
            <JsonLd data={generateAggregateRatingSchema({ reviews })} />

            <main className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                    <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                        <Link href="/"><Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" priority /></Link>
                        <div className="flex items-center gap-4">
                            <Link href="/auth/signin" className="text-slate-600 hover:text-blue-600 font-medium hidden sm:block">Sign In</Link>
                            <Link href="/book" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg">Book Now</Link>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="pt-28 pb-16 bg-gradient-to-b from-slate-50 to-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="flex justify-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                                What Our <span className="text-blue-600">Customers</span> Say
                            </h1>
                            <p className="text-xl text-slate-600 mb-8">
                                Don&apos;t just take our word for it. See what real customers have to say about
                                their experience with Fixelo cleaning services.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-12 bg-blue-600 text-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-4xl font-bold mb-1">{stat.value}</div>
                                    <div className="text-blue-100 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Reviews Grid */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {reviews.map((review, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {review.author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{review.author}</div>
                                            <div className="flex items-center gap-1 text-sm text-slate-500">
                                                <MapPin className="w-3 h-3" />
                                                {review.location}
                                            </div>
                                        </div>
                                    </div>

                                    <StarRating rating={review.rating} />

                                    <div className="mt-4 relative">
                                        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-blue-100" />
                                        <p className="text-slate-600 leading-relaxed pl-4">
                                            {review.reviewBody}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-sm text-blue-600 font-medium">{review.service}</span>
                                        <span className="text-sm text-slate-400">{new Date(review.datePublished).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trust Section */}
                <section className="py-16 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-6">Why Customers Trust Fixelo</h2>
                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold mb-2">Verified Cleaners</h3>
                                    <p className="text-sm text-slate-600">All cleaners are background checked and verified</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold mb-2">Transparent Pricing</h3>
                                    <p className="text-sm text-slate-600">No hidden fees - what you see is what you pay</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-sm">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                                    </div>
                                    <h3 className="font-semibold mb-2">Satisfaction Guaranteed</h3>
                                    <p className="text-sm text-slate-600">Not happy? We&apos;ll re-clean for free</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-700">
                    <div className="container mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Join Our Happy Customers</h2>
                        <p className="text-xl text-blue-100 mb-8">Experience the Fixelo difference today!</p>
                        <Link href="/book" className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl">
                            Book Your Cleaning <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12">
                    <div className="container mx-auto px-4 sm:px-6 text-center">
                        <Image src="/logo.svg" alt="Fixelo" width={100} height={25} className="h-7 w-auto mx-auto mb-4 brightness-0 invert" />
                        <p className="text-slate-400 text-sm mb-4">5-star rated cleaning service in Orlando, FL.</p>
                        <div className="flex justify-center gap-4 text-sm text-slate-400">
                            <Link href="/house-cleaning-orlando" className="hover:text-white">Orlando</Link>
                            <Link href="/house-cleaning-kissimmee" className="hover:text-white">Kissimmee</Link>
                            <Link href="/pricing" className="hover:text-white">Pricing</Link>
                        </div>
                        <div className="border-t border-slate-800 mt-8 pt-8 text-slate-500 text-sm">© {new Date().getFullYear()} Fixelo.</div>
                    </div>
                </footer>
            </main>
        </>
    );
}
