'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            <section className="pt-32 pb-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-xl text-slate-300">
                        Last updated: January 15, 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-slate-200">
                    <div className="prose prose-slate max-w-none">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Fixelo ("the Platform"), you accept and agree to be bound by
                            the terms and provision of this agreement. If you do not agree to these Terms of Service,
                            please do not use our Platform.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Fixelo provides an online marketplace platform that connects customers seeking home
                            cleaning services with independent cleaning service providers ("Cleaners"). Fixelo is
                            not a cleaning service provider and does not employ any Cleaners. The Platform facilitates
                            connections between customers and Cleaners.
                        </p>

                        <h2>3. User Accounts</h2>
                        <h3>3.1 Registration</h3>
                        <p>
                            You must create an account to use certain features of the Platform. You agree to provide
                            accurate, current, and complete information during registration and to update such
                            information to keep it accurate, current, and complete.
                        </p>
                        <h3>3.2 Account Security</h3>
                        <p>
                            You are responsible for safeguarding your password and for all activities that occur
                            under your account. You agree to notify Fixelo immediately of any unauthorized use of
                            your account.
                        </p>

                        <h2>4. Booking and Payment</h2>
                        <h3>4.1 Service Bookings</h3>
                        <p>
                            When you book a cleaning service through the Platform, you enter into a direct contract
                            wi the assigned Cleaner. Fixelo facilitates payment processing but is not a party to
                            this service agreement.
                        </p>
                        <h3>4.2 Pricing</h3>
                        <p>
                            All prices displayed on the Platform are in US Dollars. Prices may vary based on service
                            type, home size, location, and additional services requested. Final pricing will be
                            displayed before payment confirmation.
                        </p>
                        <h3>4.3 Payment Processing</h3>
                        <p>
                            Payments are processed securely through Stripe. By providing payment information, you
                            represent that you are authorized to use the payment method and authorize Fixelo to
                            charge the total amount to your payment method.
                        </p>

                        <h2>5. Cancellation and Refund Policy</h2>
                        <h3>5.1 Customer Cancellations</h3>
                        <p>
                            You may cancel a booking up to 24 hours before the scheduled service time for a full
                            refund. Cancellations made less than 24 hours before the scheduled time may incur a
                            cancellation fee of 50% of the service cost.
                        </p>
                        <h3>5.2 Cleaner Cancellations</h3>
                        <p>
                            If a Cleaner cancels your booking, you will receive a full refund and Fixelo will
                            attempt to find an alternative Cleaner for your scheduled time.
                        </p>
                        <h3>5.3 Refunds</h3>
                        <p>
                            Refunds will be processed to the original payment method within 5-10 business days.
                            If you are unsatisfied with a service, please contact us within 24 hours of service
                            completion to request a review.
                        </p>

                        <h2>6. User Conduct</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Platform for any illegal purpose or in violation of any local, state, national, or international law</li>
                            <li>Harass, abuse, or harm Cleaners or other users</li>
                            <li>Submit false or misleading information</li>
                            <li>Circumvent the Platform to directly contract with Cleaners</li>
                            <li>Interfere with or disrupt the Platform's operation</li>
                        </ul>

                        <h2>7. Cleaner Terms</h2>
                        <h3>7.1 Independent Contractors</h3>
                        <p>
                            Cleaners are independent contractors and are not employees, partners, or agents of
                            Fixelo. Cleaners are responsible for their own taxes, insurance, and compliance with
                            applicable laws.
                        </p>
                        <h3>7.2 Background Checks</h3>
                        <p>
                            All Cleaners undergo identity verification and background checks. However, Fixelo does
                            not guarantee the quality of services provided by Cleaners.
                        </p>

                        <h2>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Fixelo shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages, or any loss of profits or
                            revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill,
                            or other intangible losses resulting from your use of the Platform.
                        </p>

                        <h2>9. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold Fixelo harmless from any claims, damages, losses,
                            liabilities, and expenses (including attorneys' fees) arising from your use of the
                            Platform or violation of these Terms.
                        </p>

                        <h2>10. Dispute Resolution</h2>
                        <h3>10.1 Informal Resolution</h3>
                        <p>
                            If you have a dispute with Fixelo, you agree to first contact us at support@fixelo.com
                            to attempt to resolve the dispute informally.
                        </p>
                        <h3>10.2 Arbitration</h3>
                        <p>
                            Any dispute that cannot be resolved informally shall be resolved through binding
                            arbitration in Orlando, Florida, in accordance with the rules of the American
                            Arbitration Association.
                        </p>

                        <h2>11. Modifications to Terms</h2>
                        <p>
                            Fixelo reserves the right to modify these Terms at any time. We will notify users of
                            material changes via email or through the Platform. Your continued use of the Platform
                            after such modifications constitutes acceptance of the updated Terms.
                        </p>

                        <h2>12. Termination</h2>
                        <p>
                            Fixelo may terminate or suspend your account and access to the Platform immediately,
                            without prior notice, for any reason, including but not limited to breach of these Terms.
                        </p>

                        <h2>13. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the State
                            of Florida, without regard to its conflict of law provisions.
                        </p>

                        <h2>14. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p>
                            <strong>Email:</strong> <a href="mailto:legal@fixelo.app" className="text-blue-600">legal@fixelo.app</a><br />
                            <strong>Mail:</strong> Fixelo Legal Team, Orlando, FL 32801<br />
                            <strong>Website:</strong> <a href="https://fixelo.app" className="text-blue-600">https://fixelo.app</a>
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mt-8">
                            <p className="text-sm text-blue-900 mb-0">
                                <strong>Questions?</strong> If you have any questions about these Terms of Service,
                                please contact us at <a href="mailto:legal@fixelo.app" className="text-blue-600 underline">legal@fixelo.app</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
