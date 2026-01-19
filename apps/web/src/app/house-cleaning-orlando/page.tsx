import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, Shield, ArrowRight, MapPin, Phone, Clock } from 'lucide-react';
import { FAQSection } from '@/components/faq-section';
import {
    JsonLd,
    generateLocalBusinessSchema,
    generateServiceSchema,
    generateFAQSchema,
    generateBreadcrumbSchema
} from '@/lib/schema-markup';
import { getCityBySlug, FAQ_GENERAL, SEO_CONFIG } from '@/lib/seo-config';

const city = getCityBySlug('orlando')!;

export const metadata: Metadata = {
    title: city.metaTitle,
    description: city.metaDescription,
    openGraph: {
        title: city.metaTitle,
        description: city.metaDescription,
        url: `${SEO_CONFIG.siteUrl}/house-cleaning-orlando`,
        siteName: SEO_CONFIG.siteName,
        type: 'website',
    },
    alternates: {
        canonical: `${SEO_CONFIG.siteUrl}/house-cleaning-orlando`,
    },
};

const localFAQs = [
    {
        question: `How much does house cleaning cost in ${city.name}?`,
        answer: `House cleaning in ${city.name} starts at $109 for Standard cleaning. Deep cleaning starts at $169, and Move-in/Move-out cleaning starts at $129. Final pricing depends on your home size and specific requirements.`,
    },
    {
        question: `Do you serve all areas of ${city.name}?`,
        answer: `Yes! We serve all of ${city.name} including ${city.neighborhoods.slice(0, 5).join(', ')}, and more. Our cleaners are available throughout the greater ${city.name} area.`,
    },
    {
        question: `How quickly can I book a cleaner in ${city.name}?`,
        answer: `You can book a cleaner as early as tomorrow! We offer same-day availability in ${city.name} when cleaners are available. Simply book online and choose your preferred date and time.`,
    },
    ...FAQ_GENERAL.slice(0, 3),
];

export default function HouseCleaningOrlandoPage() {
    const breadcrumbs = [
        { name: 'Home', url: SEO_CONFIG.siteUrl },
        { name: `House Cleaning ${city.name}`, url: `${SEO_CONFIG.siteUrl}/house-cleaning-orlando` },
    ];

    return (
        <>
            {/* Schema Markup */}
            <JsonLd data={generateLocalBusinessSchema({ city: city.name, state: city.stateCode })} />
            <JsonLd data={generateServiceSchema({
                name: `House Cleaning in ${city.name}`,
                description: `Professional house cleaning services in ${city.name}, ${city.stateCode}`,
                priceRange: '$109-$300',
                city: city.name,
                url: `${SEO_CONFIG.siteUrl}/house-cleaning-orlando`,
            })} />
            <JsonLd data={generateFAQSchema({ questions: localFAQs })} />
            <JsonLd data={generateBreadcrumbSchema({ items: breadcrumbs })} />

            <main className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                    <div className="container mx-auto px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2">
                                <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" priority />
                            </Link>
                            <div className="flex items-center gap-4">
                                <Link href="/auth/signin" className="text-slate-600 hover:text-blue-600 font-medium hidden sm:block">
                                    Sign In
                                </Link>
                                <Link
                                    href="/book"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg"
                                >
                                    Book Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Breadcrumbs */}
                <div className="pt-20 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6 py-3">
                        <nav className="text-sm text-slate-500">
                            <Link href="/" className="hover:text-blue-600">Home</Link>
                            <span className="mx-2">/</span>
                            <span className="text-slate-900">House Cleaning {city.name}</span>
                        </nav>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="bg-gradient-to-b from-slate-50 to-white py-12 sm:py-16 lg:py-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                                <MapPin className="w-4 h-4" />
                                Serving {city.name}, {city.stateCode}
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                Professional House Cleaning in{' '}
                                <span className="text-blue-600">{city.name}, FL</span>
                            </h1>

                            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                                Book vetted, insured cleaners in {city.name}. Transparent pricing, easy online booking,
                                and a satisfaction guarantee. Standard cleaning from $109.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                                <Link
                                    href="/book"
                                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all"
                                >
                                    Get Your Free Quote
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href={`tel:${SEO_CONFIG.phone}`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-xl font-bold text-lg border-2 border-slate-200 hover:border-blue-200"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Us Today
                                </a>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-medium">Insured & Bonded</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">5-Star Rated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-medium">Same-Day Available</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="py-16 sm:py-20 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                                Cleaning Services in {city.name}
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                We offer a range of professional cleaning services to meet your needs.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* Standard */}
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 hover:border-blue-200 hover:shadow-xl transition-all">
                                <h3 className="text-2xl font-bold mb-2">Standard Cleaning</h3>
                                <div className="text-4xl font-bold text-blue-600 mb-4">$109<span className="text-lg text-slate-500 font-normal"> starting</span></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        All rooms vacuumed & mopped
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Bathrooms sanitized
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Kitchen cleaned
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Dusting & trash removal
                                    </li>
                                </ul>
                                <Link href="/book" className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-center rounded-xl font-semibold">
                                    Book Standard
                                </Link>
                            </div>

                            {/* Deep */}
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-xl relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                                    Most Popular
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Deep Cleaning</h3>
                                <div className="text-4xl font-bold mb-4">$169<span className="text-lg text-blue-100 font-normal"> starting</span></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-200" />
                                        Everything in Standard
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-200" />
                                        Inside appliances
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-200" />
                                        Baseboards & blinds
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-blue-200" />
                                        Detailed scrubbing
                                    </li>
                                </ul>
                                <Link href="/book" className="block w-full py-3 bg-white text-blue-600 text-center rounded-xl font-semibold">
                                    Book Deep Clean
                                </Link>
                            </div>

                            {/* Move */}
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-8 hover:border-blue-200 hover:shadow-xl transition-all">
                                <h3 className="text-2xl font-bold mb-2">Move In/Out</h3>
                                <div className="text-4xl font-bold text-blue-600 mb-4">$129<span className="text-lg text-slate-500 font-normal"> starting</span></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Complete property clean
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Inside closets & cabinets
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Appliance deep clean
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        Get your deposit back!
                                    </li>
                                </ul>
                                <Link href="/book" className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-center rounded-xl font-semibold">
                                    Book Move Clean
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Areas Served */}
                <section className="py-16 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
                                Areas We Serve in {city.name}
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {city.neighborhoods.map((neighborhood) => (
                                    <div key={neighborhood} className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span className="text-slate-700">{neighborhood}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-center mt-8 text-slate-600">
                                Don&apos;t see your area? We likely cover it!
                                <Link href="/book" className="text-blue-600 hover:underline ml-1">Get a quote</Link> to confirm service availability.
                            </p>
                        </div>
                    </div>
                </section>

                {/* About City Section */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold mb-6">
                                Why Choose Fixelo for House Cleaning in {city.name}?
                            </h2>

                            <div className="prose prose-lg text-slate-600">
                                <p>{city.description}</p>

                                <p>
                                    Whether you live in {city.neighborhoods[0]}, {city.neighborhoods[1]}, or anywhere else in the {city.name} area,
                                    our professional cleaners are ready to help you maintain a spotless home. We understand that {city.name} residents
                                    lead busy lives, which is why we make booking a cleaning as easy as possible.
                                </p>

                                <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">What Sets Us Apart</h3>
                                <ul className="space-y-2">
                                    <li><strong>Verified Cleaners:</strong> Every cleaner passes background checks and verification.</li>
                                    <li><strong>Transparent Pricing:</strong> No hidden fees. The price you see is what you pay.</li>
                                    <li><strong>Easy Online Booking:</strong> Book in under 2 minutes, 24/7.</li>
                                    <li><strong>Satisfaction Guaranteed:</strong> Not happy? We&apos;ll re-clean for free.</li>
                                    <li><strong>Local Service:</strong> Cleaners who know and love {city.name}.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <FAQSection
                    title={`House Cleaning FAQ - ${city.name}`}
                    subtitle="Common questions about our cleaning services"
                    faqs={localFAQs}
                />

                {/* CTA Section */}
                <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-blue-700">
                    <div className="container mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                            Ready for a Spotless Home in {city.name}?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Book your professional cleaning today and experience the Fixelo difference!
                        </p>
                        <Link
                            href="/book"
                            className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all"
                        >
                            Get Your Free Quote
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                            <div className="col-span-2 md:col-span-1">
                                <Image src="/logo.svg" alt="Fixelo" width={100} height={25} className="h-7 w-auto mb-4 brightness-0 invert" />
                                <p className="text-slate-400 text-sm">
                                    Professional home cleaning in {city.name}, FL.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Services</h4>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li><Link href="/book" className="hover:text-white">Standard Cleaning</Link></li>
                                    <li><Link href="/book" className="hover:text-white">Deep Cleaning</Link></li>
                                    <li><Link href="/book" className="hover:text-white">Move In/Out</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Locations</h4>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li><Link href="/house-cleaning-orlando" className="hover:text-white">Orlando</Link></li>
                                    <li><Link href="/house-cleaning-kissimmee" className="hover:text-white">Kissimmee</Link></li>
                                    <li><Link href="/house-cleaning-winter-park" className="hover:text-white">Winter Park</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Company</h4>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li><Link href="/about" className="hover:text-white">About</Link></li>
                                    <li><Link href="/become-a-pro" className="hover:text-white">Become a Pro</Link></li>
                                    <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
                            © {new Date().getFullYear()} Fixelo. All rights reserved.
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}
