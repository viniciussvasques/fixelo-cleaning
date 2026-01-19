import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';
import { FAQSection } from '@/components/faq-section';
import { JsonLd, generateFAQSchema } from '@/lib/schema-markup';
import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
    title: 'Cleaning Prices | Transparent Pricing | Fixelo',
    description: 'Transparent house cleaning prices in Orlando, FL. Standard cleaning from $109, Deep cleaning from $169, Move-in/out from $129. No hidden fees, instant quotes.',
    openGraph: {
        title: 'Cleaning Prices | Transparent Pricing | Fixelo',
        description: 'Transparent house cleaning prices. Standard from $109, Deep from $169. No hidden fees.',
        url: `${SEO_CONFIG.siteUrl}/pricing`,
        siteName: SEO_CONFIG.siteName,
        type: 'website',
    },
    alternates: { canonical: `${SEO_CONFIG.siteUrl}/pricing` },
};

const pricingFAQs = [
    {
        question: 'How is the final price calculated?',
        answer: 'Your final price is based on the size of your home (bedrooms and bathrooms), the type of cleaning service, and any add-ons you select. Our pricing is transparent - the quote you see is what you pay, no hidden fees.',
    },
    {
        question: 'Do you charge by the hour?',
        answer: 'No, we charge a flat rate based on your home size and service type. This means you know exactly what you\'ll pay before the cleaning begins, and our cleaners can take the time needed to do the job right.',
    },
    {
        question: 'Are cleaning supplies included?',
        answer: 'Yes! All cleaning supplies and equipment are included in our prices. You don\'t need to provide anything. If you have specific product preferences, just let us know.',
    },
    {
        question: 'Do you offer recurring cleaning discounts?',
        answer: 'Yes! Weekly cleanings receive a 20% discount, bi-weekly cleanings receive 15% off, and monthly cleanings get 10% off the regular price.',
    },
    {
        question: 'Is there a minimum charge?',
        answer: 'Our minimum service charge is $89 for apartments and smaller spaces. This ensures our cleaners are fairly compensated for their time and travel.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure online payment system. Payment is processed after your cleaning is completed.',
    },
];

const services = [
    {
        name: 'Standard Cleaning',
        price: 109,
        description: 'Regular maintenance cleaning for a fresh, tidy home',
        popular: false,
        includes: [
            'All rooms vacuumed & mopped',
            'Bathrooms cleaned & sanitized',
            'Kitchen surfaces & appliances (exterior)',
            'Dusting all accessible surfaces',
            'Trash removal',
            'Bed making',
        ],
    },
    {
        name: 'Deep Cleaning',
        price: 169,
        description: 'Thorough cleaning for homes that need extra attention',
        popular: true,
        includes: [
            'Everything in Standard Cleaning',
            'Inside oven & microwave',
            'Inside refrigerator',
            'Inside cabinets & drawers',
            'Baseboards & door frames',
            'Light fixtures & ceiling fans',
            'Window sills & blinds',
        ],
    },
    {
        name: 'Move In/Out Cleaning',
        price: 129,
        description: 'Complete cleaning for moving transitions',
        popular: false,
        includes: [
            'Deep clean entire property',
            'Inside all closets & cabinets',
            'All appliance interiors',
            'Inside windows',
            'Garage sweep (if applicable)',
            'Final walkthrough ready',
        ],
    },
    {
        name: 'Airbnb Turnover',
        price: 99,
        description: 'Quick turnovers for vacation rentals',
        popular: false,
        includes: [
            'Complete property clean',
            'Linen change (provided)',
            'Bathroom restock check',
            'Kitchen reset',
            'Photo-ready presentation',
            'Same-day availability',
        ],
    },
];

const addons = [
    { name: 'Inside Fridge', price: 30 },
    { name: 'Inside Oven', price: 25 },
    { name: 'Interior Windows', price: 40 },
    { name: 'Laundry (1 load)', price: 20 },
    { name: 'Organizing', price: 35 },
    { name: 'Garage Cleaning', price: 50 },
];

export default function PricingPage() {
    return (
        <>
            <JsonLd data={generateFAQSchema({ questions: pricingFAQs })} />

            <main className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                    <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                        <Link href="/"><Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" priority /></Link>
                        <div className="flex items-center gap-4">
                            <Link href="/auth/signin" className="text-slate-600 hover:text-blue-600 font-medium hidden sm:block">Sign In</Link>
                            <Link href="/book" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg">Get Quote</Link>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="pt-28 pb-16 bg-gradient-to-b from-slate-50 to-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                                Transparent <span className="text-blue-600">Pricing</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-8">
                                No hidden fees. No surprises. The price you see is the price you pay.
                                Get an instant quote in under 2 minutes.
                            </p>
                            <Link href="/book" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl">
                                Get Your Free Quote <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {services.map((service) => (
                                <div
                                    key={service.name}
                                    className={`rounded-2xl p-6 flex flex-col ${service.popular
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl relative'
                                            : 'bg-white border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all'
                                        }`}
                                >
                                    {service.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                                    <p className={`text-sm mb-4 ${service.popular ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {service.description}
                                    </p>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold">${service.price}</span>
                                        <span className={`text-sm ${service.popular ? 'text-blue-100' : 'text-slate-500'}`}> starting</span>
                                    </div>
                                    <ul className="space-y-2 mb-6 flex-grow">
                                        {service.includes.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${service.popular ? 'text-blue-200' : 'text-emerald-500'}`} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/book"
                                        className={`block w-full py-3 text-center rounded-xl font-semibold ${service.popular
                                                ? 'bg-white text-blue-600 hover:bg-blue-50'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                            }`}
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Price by Home Size */}
                <section className="py-16 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold mb-8 text-center">Price by Home Size</h2>
                            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                                <table className="w-full">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold">Home Size</th>
                                            <th className="px-6 py-4 text-center font-semibold">Standard</th>
                                            <th className="px-6 py-4 text-center font-semibold">Deep</th>
                                            <th className="px-6 py-4 text-center font-semibold">Move</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-6 py-4">1 bed / 1 bath</td>
                                            <td className="px-6 py-4 text-center font-semibold">$109</td>
                                            <td className="px-6 py-4 text-center font-semibold">$169</td>
                                            <td className="px-6 py-4 text-center font-semibold">$129</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">2 bed / 2 bath</td>
                                            <td className="px-6 py-4 text-center font-semibold">$129</td>
                                            <td className="px-6 py-4 text-center font-semibold">$199</td>
                                            <td className="px-6 py-4 text-center font-semibold">$159</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">3 bed / 2 bath</td>
                                            <td className="px-6 py-4 text-center font-semibold">$149</td>
                                            <td className="px-6 py-4 text-center font-semibold">$229</td>
                                            <td className="px-6 py-4 text-center font-semibold">$189</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">4 bed / 3 bath</td>
                                            <td className="px-6 py-4 text-center font-semibold">$179</td>
                                            <td className="px-6 py-4 text-center font-semibold">$279</td>
                                            <td className="px-6 py-4 text-center font-semibold">$229</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">5+ bed / 4+ bath</td>
                                            <td className="px-6 py-4 text-center font-semibold">$199+</td>
                                            <td className="px-6 py-4 text-center font-semibold">$329+</td>
                                            <td className="px-6 py-4 text-center font-semibold">$269+</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-center text-slate-500 mt-4 text-sm">
                                * Prices are estimates. Get an exact quote by booking online.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Add-ons */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold mb-8 text-center">Available Add-ons</h2>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {addons.map((addon) => (
                                    <div key={addon.name} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl">
                                        <span className="font-medium">{addon.name}</span>
                                        <span className="text-blue-600 font-bold">+${addon.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recurring Discounts */}
                <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-8">Save with Recurring Cleaning</h2>
                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                                    <div className="text-4xl font-bold mb-2">20%</div>
                                    <div className="text-blue-100">Weekly Cleaning</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                                    <div className="text-4xl font-bold mb-2">15%</div>
                                    <div className="text-blue-100">Bi-Weekly Cleaning</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                                    <div className="text-4xl font-bold mb-2">10%</div>
                                    <div className="text-blue-100">Monthly Cleaning</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <FAQSection
                    title="Pricing FAQ"
                    subtitle="Common questions about our pricing"
                    faqs={pricingFAQs}
                />

                {/* CTA */}
                <section className="py-16 bg-slate-50">
                    <div className="container mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Your Quote?</h2>
                        <p className="text-lg text-slate-600 mb-8">Book in under 2 minutes. No credit card required for quote.</p>
                        <Link href="/book" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl">
                            Get Your Free Quote <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-900 text-white py-12">
                    <div className="container mx-auto px-4 sm:px-6 text-center">
                        <Image src="/logo.svg" alt="Fixelo" width={100} height={25} className="h-7 w-auto mx-auto mb-4 brightness-0 invert" />
                        <p className="text-slate-400 text-sm mb-4">Transparent pricing for professional cleaning.</p>
                        <div className="flex justify-center gap-4 text-sm text-slate-400">
                            <Link href="/house-cleaning-orlando" className="hover:text-white">Orlando</Link>
                            <Link href="/house-cleaning-kissimmee" className="hover:text-white">Kissimmee</Link>
                            <Link href="/house-cleaning-winter-park" className="hover:text-white">Winter Park</Link>
                        </div>
                        <div className="border-t border-slate-800 mt-8 pt-8 text-slate-500 text-sm">© {new Date().getFullYear()} Fixelo.</div>
                    </div>
                </footer>
            </main>
        </>
    );
}
