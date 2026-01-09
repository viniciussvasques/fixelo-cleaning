'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Phone, Clock, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setIsSubmitting(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Contact form error:', error);
            setIsSubmitting(false);
            alert('Failed to send message. Please try again.');
        }
    };

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
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Have questions? We're here to help!
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Email Us</h3>
                                    <a href="mailto:support@fixelo.com" className="text-blue-600 hover:underline">
                                        support@fixelo.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Call Us</h3>
                                    <a href="tel:+14075551234" className="text-blue-600 hover:underline">
                                        (407) 555-1234
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Business Hours</h3>
                                    <p className="text-sm text-slate-600">Monday - Friday: 8am - 6pm</p>
                                    <p className="text-sm text-slate-600">Saturday: 9am - 5pm</p>
                                    <p className="text-sm text-slate-600">Sunday: Closed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Location</h3>
                                    <p className="text-sm text-slate-600">
                                        Serving Orlando, FL<br />
                                        and surrounding areas
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl p-8 border border-slate-200">
                            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>

                            {submitted ? (
                                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2">Message Sent!</h3>
                                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="mt-4 text-green-600 hover:underline font-medium"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                                            Subject *
                                        </label>
                                        <input
                                            id="subject"
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="Tell us more..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
