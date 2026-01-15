'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
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
            <section className="pt-32 pb-16 bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                            <p className="text-xl text-green-100 mt-2">
                                Last updated: January 15, 2026
                            </p>
                        </div>
                    </div>
                    <p className="text-lg text-green-100 max-w-3xl">
                        Your privacy is important to us. This policy explains how we collect, use, and protect
                        your personal information.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-slate-200">
                    <div className="prose prose-slate max-w-none">
                        <h2>1. Information We Collect</h2>

                        <h3>1.1 Information You Provide</h3>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                            <li><strong>Profile Information:</strong> Address, payment methods, service preferences</li>
                            <li><strong>Booking Information:</strong> Service details, scheduling preferences, special instructions</li>
                            <li><strong>Payment Information:</strong> Credit card details (processed securely through Stripe)</li>
                            <li><strong>Communications:</strong> Messages, reviews, and feedback you provide</li>
                        </ul>

                        <h3>1.2 Information We Collect Automatically</h3>
                        <p>When you use our Platform, we automatically collect:</p>
                        <ul>
                            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the Platform</li>
                            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                            <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                            <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience</li>
                        </ul>

                        <h3>1.3 Information from Third Parties</h3>
                        <p>We may receive information from:</p>
                        <ul>
                            <li><strong>Background Check Providers:</strong> For Cleaner verification</li>
                            <li><strong>Payment Processors:</strong> Transaction confirmations from Stripe</li>
                            <li><strong>Social Media:</strong> If you choose to connect your social accounts</li>
                        </ul>

                        <h2>2. How We Use Your Information</h2>
                        <p>We use the collected information for:</p>
                        <ul>
                            <li><strong>Service Provision:</strong> To facilitate bookings and connect you with Cleaners</li>
                            <li><strong>Payment Processing:</strong> To process payments and prevent fraud</li>
                            <li><strong>Communication:</strong> To send booking confirmations, updates, and customer support</li>
                            <li><strong>Platform Improvement:</strong> To analyze usage and improve our services</li>
                            <li><strong>Marketing:</strong> To send promotional emails (you can opt-out anytime)</li>
                            <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
                        </ul>

                        <h2>3. How We Share Your Information</h2>

                        <h3>3.1 With Cleaners</h3>
                        <p>
                            When you book a service, we share your name, address, phone number, and service details
                            with the assigned Cleaner to enable service delivery.
                        </p>

                        <h3>3.2 With Service Providers</h3>
                        <p>We share information with third-party service providers who assist us with:</p>
                        <ul>
                            <li>Payment processing (Stripe)</li>
                            <li>Background checks (for Cleaner verification)</li>
                            <li>Email delivery (Resend)</li>
                            <li>SMS notifications (Twilio)</li>
                            <li>Analytics and performance monitoring</li>
                        </ul>

                        <h3>3.3 For Legal Reasons</h3>
                        <p>We may disclose information if required by law or if we believe it's necessary to:</p>
                        <ul>
                            <li>Comply with legal processes or government requests</li>
                            <li>Protect the rights and safety of Fixelo, users, or the public</li>
                            <li>Detect, prevent, or address fraud or security issues</li>
                        </ul>

                        <h3>3.4 Business Transfers</h3>
                        <p>
                            If Fixelo is involved in a merger, acquisition, or sale of assets, your information
                            may be transferred as part of that transaction.
                        </p>

                        <h2>4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal
                            information, including:
                        </p>
                        <ul>
                            <li>Encryption of data in transit and at rest</li>
                            <li>Secure authentication and access controls</li>
                            <li>Regular security audits and updates</li>
                            <li>Employee training on data protection</li>
                        </ul>
                        <p>
                            However, no method of transmission over the Internet is 100% secure. We cannot guarantee
                            absolute security of your information.
                        </p>

                        <h2>5. Your Rights and Choices</h2>

                        <h3>5.1 Access and Update</h3>
                        <p>
                            You can access and update your account information at any time through your account
                            settings.
                        </p>

                        <h3>5.2 Data Deletion</h3>
                        <p>
                            You can request deletion of your account and personal data by contacting us at
                            privacy@fixelo.com. Some information may be retained as required by law or for
                            legitimate business purposes.
                        </p>

                        <h3>5.3 Marketing Communications</h3>
                        <p>
                            You can opt out of promotional emails by clicking the "unsubscribe" link in any
                            marketing email or by updating your preferences in account settings.
                        </p>

                        <h3>5.4 Cookies</h3>
                        <p>
                            Most browsers allow you to control cookies through their settings. However, disabling
                            cookies may limit your ability to use certain features of the Platform.
                        </p>

                        <h3>5.5 Do Not Track</h3>
                        <p>
                            Our Platform does not currently respond to "Do Not Track" signals from browsers.
                        </p>

                        <h2>6. Data Retention</h2>
                        <p>
                            We retain your personal information for as long as necessary to provide our services
                            and fulfill the purposes outlined in this Privacy Policy, unless a longer retention
                            period is required by law.
                        </p>

                        <h2>7. Children's Privacy</h2>
                        <p>
                            Our Platform is not intended for children under 18 years of age. We do not knowingly
                            collect personal information from children. If you believe we have collected information
                            from a child, please contact us immediately.
                        </p>

                        <h2>8. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and processed in countries other than your country
                            of residence. These countries may have different data protection laws. By using our
                            Platform, you consent to such transfers.
                        </p>

                        <h2>9. California Privacy Rights</h2>
                        <p>
                            If you are a California resident, you have additional rights under the California
                            Consumer Privacy Act (CCPA), including:
                        </p>
                        <ul>
                            <li>Right to know what personal information we collect and how it's used</li>
                            <li>Right to request deletion of your personal information</li>
                            <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                            <li>Right to non-discrimination for exercising your privacy rights</li>
                        </ul>

                        <h2>10. GDPR Rights (European Users)</h2>
                        <p>
                            If you are in the European Economic Area, you have rights under the General Data
                            Protection Regulation (GDPR), including:
                        </p>
                        <ul>
                            <li>Right of access to your personal data</li>
                            <li>Right to rectification of inaccurate data</li>
                            <li>Right to erasure ("right to be forgotten")</li>
                            <li>Right to restrict processing</li>
                            <li>Right to data portability</li>
                            <li>Right to object to processing</li>
                        </ul>

                        <h2>11. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of material
                            changes by posting the new policy on this page and updating the "Last Updated" date.
                            We encourage you to review this policy periodically.
                        </p>

                        <h2>12. Contact Us</h2>
                        <p>
                            If you have questions or concerns about this Privacy Policy or our data practices,
                            please contact us:
                        </p>
                        <p>
                            <strong>Email:</strong> <a href="mailto:privacy@fixelo.app" className="text-blue-600">privacy@fixelo.app</a><br />
                            <strong>Mail:</strong> Fixelo Privacy Team, Orlando, FL 32801<br />
                            <strong>Website:</strong> <a href="https://fixelo.app" className="text-blue-600">https://fixelo.app</a>
                        </p>

                        <div className="bg-green-50 border-l-4 border-green-600 p-6 mt-8">
                            <p className="text-sm text-green-900 mb-0">
                                <strong>🔒 Your Privacy Matters:</strong> We are committed to protecting your personal
                                information. If you have any concerns about your data, please don't hesitate to
                                contact us at <a href="mailto:privacy@fixelo.app" className="text-green-700 underline">privacy@fixelo.app</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
