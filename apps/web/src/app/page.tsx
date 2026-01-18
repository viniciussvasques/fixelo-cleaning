'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Shield, Star, ArrowRight, CheckCircle, Zap, Calendar, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServiceType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  inclusions: string[];
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/service-types');
      const data = await res.json();
      setServices(data.serviceTypes || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get service by slug, with fallback
  const getService = (slug: string) => {
    return services.find(s => s.slug === slug) || null;
  };

  const standardService = getService('standard');
  const deepService = getService('deep');
  const airbnbService = getService('airbnb');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 animate-logo-glow">
              <Image src="/logo.svg" alt="Fixelo" width={140} height={35} className="h-8 sm:h-9 w-auto" priority />
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <Link href="#services" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Services
              </Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                How It Works
              </Link>
              <Link href="/become-a-pro" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Become a Pro
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile: Become a Pro link */}
              <Link
                href="/become-a-pro"
                className="lg:hidden text-emerald-600 hover:text-emerald-700 font-medium transition-colors text-sm"
              >
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Pro
                </span>
              </Link>
              <Link
                href="/auth/signin"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Sparkles className="w-4 h-4" />
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500 rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-blue-100 animate-fade-in">
              <Star className="w-4 h-4 fill-current" />
              Professional Cleaning in Orlando
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight">
              Professional Home
              <br />
              <span className="gradient-text">Cleaning Services</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
              Book vetted, insured cleaners in minutes. Flexible scheduling, transparent pricing, and a sparkling clean home guaranteed.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 px-4">
              <Link
                href="/book"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                Book Your Cleaning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-xl font-bold text-base sm:text-lg border-2 border-slate-200 hover:border-blue-200 transition-all duration-300"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-slate-500 px-4">
              <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Insured & Bonded</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Instant Booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Getting your home cleaned is easier than ever. Just three simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-600 mb-2">01</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Choose Your Service</h3>
              <p className="text-slate-600 leading-relaxed">Select from Standard, Deep, or Airbnb Turnover cleaning based on your needs.</p>
            </div>

            {/* Step 2 */}
            <div className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/30">
                <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-600 mb-2">02</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Pick Date & Time</h3>
              <p className="text-slate-600 leading-relaxed">Choose a convenient slot that fits your schedule. We're flexible!</p>
            </div>

            {/* Step 3 */}
            <div className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-600 mb-2">03</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Relax & Enjoy</h3>
              <p className="text-slate-600 leading-relaxed">Our vetted professional arrives and transforms your space.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Dynamic from Database */}
      <section id="services" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Our Services</h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Professional cleaning tailored to your needs. All services include supplies & equipment.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {/* Standard Cleaning */}
              {standardService && (
                <div className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wide">Most Affordable</div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">{standardService.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">${standardService.basePrice}</span>
                    <span className="text-slate-500">starting</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {standardService.inclusions.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book/details?serviceId=${standardService.id}`}
                    className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold transition-all duration-300 text-center border-2 border-transparent hover:border-slate-300"
                  >
                    Book {standardService.name}
                  </Link>
                </div>
              )}

              {/* Deep Cleaning */}
              {deepService && (
                <div className="relative group bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 sm:p-8 flex flex-col shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1 border-2 border-blue-500">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                  <div className="text-xs font-semibold text-blue-100 mb-2 uppercase tracking-wide">Best Value</div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">{deepService.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">${deepService.basePrice}</span>
                    <span className="text-blue-100">starting</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {deepService.inclusions.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-100 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book/details?serviceId=${deepService.id}`}
                    className="w-full py-3.5 px-6 bg-white hover:bg-blue-50 text-blue-700 rounded-xl font-semibold transition-all duration-300 text-center shadow-lg"
                  >
                    Book {deepService.name}
                  </Link>
                </div>
              )}

              {/* Airbnb Cleaning */}
              {airbnbService && (
                <div className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wide">For Hosts</div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">{airbnbService.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">${airbnbService.basePrice}</span>
                    <span className="text-slate-500">starting</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {airbnbService.inclusions.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book/details?serviceId=${airbnbService.id}`}
                    className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold transition-all duration-300 text-center border-2 border-transparent hover:border-slate-300"
                  >
                    Book {airbnbService.name}
                  </Link>
                </div>
              )}

              {/* Show all other services if they exist */}
              {services.filter(s => !['standard', 'deep', 'airbnb'].includes(s.slug)).map(service => (
                <div key={service.id} className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">{service.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl sm:text-5xl font-bold">${service.basePrice}</span>
                    <span className="text-slate-500">starting</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {service.inclusions.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/book/details?serviceId=${service.id}`}
                    className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold transition-all duration-300 text-center"
                  >
                    Book {service.name}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-40"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready for a Sparkling Clean Home?
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Book your first cleaning today and experience the Fixelo difference! Professional, reliable, and thorough.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 bg-white hover:bg-blue-50 text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            Get Your Free Quote
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.svg" alt="Fixelo" width={120} height={30} className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-slate-400 text-sm leading-relaxed">
                Professional home cleaning services in Orlando, FL. Reliable and thorough.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/book" className="hover:text-white transition-colors">Standard Cleaning</Link></li>
                <li><Link href="/book" className="hover:text-white transition-colors">Deep Cleaning</Link></li>
                <li><Link href="/book" className="hover:text-white transition-colors">Airbnb Turnover</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/become-a-pro" className="hover:text-white transition-colors">Become a Pro</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Fixelo. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
