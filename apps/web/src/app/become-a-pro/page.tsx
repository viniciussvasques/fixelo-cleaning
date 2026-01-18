'use client';

import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, Calendar, Shield, Star, ArrowRight } from 'lucide-react';

export default function BecomeAProPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* Navigation (Simplified for Landing) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/signin" className="text-slate-600 hover:text-slate-900 font-medium hidden sm:block">
                            Sign In
                        </Link>
                        <Link
                            href="/onboarding/cleaner"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Apply Now
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-100">
                                <Star className="w-4 h-4 fill-current" />
                                Join Our Pro Network in Orlando
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
                                Earn more doing what you love. <br />
                                <span className="text-blue-600">On your terms.</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                                Join Fixelo and get access to hundreds of high-paying jobs. We handle the marketing, payments, and insurance so you can focus on the work.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link
                                    href="/onboarding/cleaner"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    Start Earning Today
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <div className="text-sm text-slate-500">
                                    <span className="block font-semibold text-slate-900">Free to join</span>
                                    No hidden monthly fees
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            {/* Abstract Shapes */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

                            {/* Image Placeholder - Generating a nice gradient block for now, ideally an image */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/3] flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="bg-white p-6 rounded-2xl shadow-lg inline-block mb-4">
                                        <div className="text-4xl font-bold text-green-600 mb-1">Competitive</div>
                                        <div className="text-slate-500 text-sm font-medium">Weekly Earnings</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-md w-32">
                                        <div className="font-bold text-slate-900">New</div>
                                        <div className="text-xs text-slate-500">Jobs Daily</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-md w-32">
                                        <div className="font-bold text-slate-900">Quality</div>
                                        <div className="text-xs text-slate-500">Clients</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why Pros Love Fixelo</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            We built this platform to respect your craft and your time.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Weekly Payouts</h3>
                            <p className="text-slate-600">
                                Get paid every Friday directly to your bank account via Stripe. No chasing clients for checks.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Total Flexibility</h3>
                            <p className="text-slate-600">
                                Set your own service radius and schedule. You choose which jobs to accept or decline.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Safety First</h3>
                            <p className="text-slate-600">
                                Every booking is insured. We verify client identities so you can work with peace of mind.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                    </div>

                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-slate-200 -z-10"></div>

                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center bg-slate-50 pt-4">
                                <div className="w-16 h-16 bg-white border-4 border-slate-200 text-slate-900 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 shrink-0 relative z-10">1</div>
                                <h3 className="text-lg font-bold mb-2">Create Profile</h3>
                                <p className="text-slate-600">Sign up and upload your documents. We'll verify your account in 24 hours.</p>
                            </div>
                            <div className="text-center bg-slate-50 pt-4">
                                <div className="w-16 h-16 bg-white border-4 border-slate-200 text-slate-900 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 shrink-0 relative z-10">2</div>
                                <h3 className="text-lg font-bold mb-2">Get Matched</h3>
                                <p className="text-slate-600">Receive job offers instantly via email or our app based on your expertise.</p>
                            </div>
                            <div className="text-center bg-slate-50 pt-4">
                                <div className="w-16 h-16 bg-white border-4 border-slate-200 text-slate-900 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6 shrink-0 relative z-10">3</div>
                                <h3 className="text-lg font-bold mb-2">Get Paid</h3>
                                <p className="text-slate-600">Complete the job and get paid automatically. Keep 100% of your tips.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-slate-900 text-white text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to grow your business?</h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                        Don't let empty schedule slots cost you money. Join Fixelo today.
                    </p>
                    <Link
                        href="/onboarding/cleaner"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                    >
                        Apply Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </main>
    );
}
