'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Calendar,
    CreditCard,
    Shield,
    Users,
    Briefcase,
    Search
} from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSection {
    title: string;
    icon: typeof HelpCircle;
    items: FAQItem[];
}

const faqSections: FAQSection[] = [
    {
        title: 'For Customers',
        icon: Users,
        items: [
            {
                question: 'How do I book a cleaning?',
                answer: 'Simply click "Book Now" on our homepage, select your service type (Standard, Deep, or Airbnb Turnover), choose the size of your home, pick a convenient date and time, and complete your payment. You\'ll receive a confirmation email immediately.'
            },
            {
                question: 'What\'s included in each cleaning service?',
                answer: 'Standard Cleaning includes dusting, vacuuming, mopping, bathroom sanitizing, and kitchen surfaces. Deep Cleaning adds inside oven, inside fridge, baseboards, blinds, and cabinet exteriors. Airbnb Turnover includes full turnover clean, fresh linens setup, and guest-ready inspection.'
            },
            {
                question: 'Can I reschedule or cancel my booking?',
                answer: 'Yes! You can reschedule or cancel for free up to 24 hours before your appointment. Cancellations within 24 hours may incur a 50% fee. You can manage your bookings from your dashboard.'
            },
            {
                question: 'Are the cleaners insured and background checked?',
                answer: 'Absolutely. All our cleaners undergo thorough background checks and identity verification. Every booking is also covered by our liability insurance for your peace of mind.'
            },
            {
                question: 'What if I\'m not satisfied with the cleaning?',
                answer: 'Your satisfaction is our priority. If you\'re not happy, contact us within 24 hours of your service and we\'ll send someone to re-clean at no additional cost, or provide a refund.'
            },
            {
                question: 'How do I pay for the service?',
                answer: 'We accept all major credit cards, debit cards, and digital wallets through our secure payment processor, Stripe. Payment is collected at the time of booking.'
            },
        ]
    },
    {
        title: 'For Cleaners (Pros)',
        icon: Briefcase,
        items: [
            {
                question: 'How do I become a Fixelo Pro?',
                answer: 'Visit our "Become a Pro" page and complete the application. You\'ll need to provide identification, proof of cleaning experience, and pass our background check. Most applications are reviewed within 24-48 hours.'
            },
            {
                question: 'How and when do I get paid?',
                answer: 'You get paid weekly every Friday via direct deposit to your bank account through Stripe. Your earnings are tracked in real-time on your dashboard. You keep 100% of your tips!'
            },
            {
                question: 'Can I choose which jobs to accept?',
                answer: 'Yes! You have complete control. Set your own availability, service area, and choose which jobs to accept or decline. There are no minimum hours or commitments.'
            },
            {
                question: 'What percentage does Fixelo take?',
                answer: 'Fixelo takes a small platform fee from each job to cover payment processing, marketing, customer acquisition, and support. Your estimated payout is shown before you accept each job.'
            },
            {
                question: 'Do I need to bring my own supplies?',
                answer: 'You have the option. Many pros bring their own supplies, but you can also use the customer\'s supplies if they prefer. Check the job details before accepting.'
            },
            {
                question: 'What if a customer doesn\'t show or cancels?',
                answer: 'If a customer cancels within 24 hours or you arrive and can\'t complete the job due to customer no-show, you may be eligible for a cancellation fee. Contact support immediately for assistance.'
            },
        ]
    },
    {
        title: 'Payments & Billing',
        icon: CreditCard,
        items: [
            {
                question: 'Is my payment information secure?',
                answer: 'Yes, all payments are processed through Stripe, a PCI-compliant payment processor. We never store your full credit card details on our servers.'
            },
            {
                question: 'How do refunds work?',
                answer: 'Refunds are processed to your original payment method within 5-10 business days. You\'ll receive an email confirmation when the refund is initiated.'
            },
            {
                question: 'Can I tip my cleaner?',
                answer: 'Absolutely! You can add a tip during checkout or after your service through your dashboard. Cleaners receive 100% of tips—Fixelo doesn\'t take any portion.'
            },
        ]
    },
    {
        title: 'Scheduling',
        icon: Calendar,
        items: [
            {
                question: 'What are your service hours?',
                answer: 'Our cleaners are available Monday through Saturday, typically from 8 AM to 6 PM. Availability may vary based on your area and cleaner schedules.'
            },
            {
                question: 'Can I request a specific cleaner?',
                answer: 'Yes! After your first booking, you can request the same cleaner for future appointments through your dashboard, subject to their availability.'
            },
            {
                question: 'What if my cleaner is running late?',
                answer: 'You\'ll receive real-time updates and notifications. If there\'s a delay, you\'ll be notified and given the option to reschedule if needed.'
            },
        ]
    },
    {
        title: 'Safety & Trust',
        icon: Shield,
        items: [
            {
                question: 'How are cleaners vetted?',
                answer: 'All cleaners undergo identity verification, background checks, and a review of their cleaning experience. We only accept cleaners who meet our high standards.'
            },
            {
                question: 'What insurance coverage is provided?',
                answer: 'Every booking includes liability coverage for accidental property damage. If something happens during the cleaning, report it within 24 hours for quick resolution.'
            },
            {
                question: 'How do I report a problem?',
                answer: 'You can report issues through your dashboard under "Support" or email us at support@fixelo.app. We aim to respond within 24 hours on business days.'
            },
        ]
    },
];

function FAQAccordion({ item }: { item: FAQItem }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            >
                <span className="font-medium text-slate-900">{item.question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                </div>
            )}
        </div>
    );
}

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter FAQs based on search
    const filteredSections = faqSections.map(section => ({
        ...section,
        items: section.items.filter(
            item =>
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.items.length > 0);

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" />
                    </Link>
                    <Link
                        href="/"
                        className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="container mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
                        Find answers to frequently asked questions or contact our support team.
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 border-0 shadow-lg focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                {filteredSections.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">No results found for "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {filteredSections.map((section, idx) => {
                            const Icon = section.icon;
                            return (
                                <section key={idx}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {section.items.map((item, i) => (
                                            <FAQAccordion key={i} item={item} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Still Need Help */}
                <div className="mt-16 bg-slate-900 rounded-2xl p-8 text-center text-white">
                    <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
                    <p className="text-slate-300 mb-6 max-w-xl mx-auto">
                        Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/contact"
                            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition-colors"
                        >
                            Contact Support
                        </Link>
                        <a
                            href="mailto:support@fixelo.app"
                            className="text-slate-300 hover:text-white transition-colors"
                        >
                            support@fixelo.app
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
