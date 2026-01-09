'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">About Fixelo</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Your trusted partner for professional home cleaning services in Orlando, FL
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                {/* Mission */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold">Our Mission</h2>
                    </div>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-slate-700 leading-relaxed">
                            At Fixelo, we believe everyone deserves a clean, comfortable home without the hassle.
                            Our mission is to connect busy homeowners with trusted, professional cleaners who take
                            pride in their work. We're building a platform that respects both our customers and our
                            service providers, creating a win-win marketplace powered by technology and trust.
                        </p>
                    </div>
                </section>

                {/* Our Story */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                            Fixelo was founded in Orlando, Florida, with a simple idea: home cleaning services
                            should be as easy to book as ordering a ride. We saw hardworking cleaning professionals
                            struggling to find clients, and busy families struggling to find reliable cleaners.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            Today, we're proud to serve thousands of homes across Orlando, matching them with
                            vetted, insured professionals who bring their expertise and care to every job.
                            Our platform handles the scheduling, payments, and logistics, so our cleaners can
                            focus on what they do best.
                        </p>
                    </div>
                </section>

                {/* Values */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Quality First</h3>
                            <p className="text-slate-600">
                                We vet every cleaner, ensure they're insured, and maintain high standards
                                through ratings and reviews.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Fair for Everyone</h3>
                            <p className="text-slate-600">
                                We believe in fair pricing for customers and fair pay for cleaners.
                                No hidden fees, no surprises.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section className="bg-white rounded-xl p-8 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Serving Orlando, FL</h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                        We're proud to call Orlando home. Our platform currently serves the greater Orlando
                        metropolitan area, and we're committed to becoming the most trusted name in home
                        cleaning services across Central Florida.
                    </p>
                </section>
            </div>
        </main>
    );
}
