'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { metaViewContent } from '@/lib/meta-pixel';

interface ServiceType {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    basePrice: number;
    inclusions: string[];
    exclusions: string[] | null;
}

function BookPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [services, setServices] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const _preselectedService = searchParams.get('service');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/service-types');
            const data = await response.json();
            setServices(data.serviceTypes || []);

            // Track Meta Pixel ViewContent
            metaViewContent({
                contentType: 'service_list',
                contentName: 'Cleaning Services',
            });
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectService = (serviceId: string) => {
        router.push(`/book/details?serviceId=${serviceId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Finding the best cleaners for you...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Trust Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4">
                <div className="container mx-auto flex items-center justify-center gap-6 text-sm font-medium flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                        <span className="ml-1">5-Star Rated</span>
                    </div>
                    <span className="hidden sm:inline text-blue-200">|</span>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        <span>100% Satisfaction Guaranteed</span>
                    </div>
                    <span className="hidden sm:inline text-blue-200">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold">From $109</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-green-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Trusted by Orlando Homeowners
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            Choose Your Clean
                        </h1>
                        <p className="text-lg text-gray-600">
                            Select the perfect service package for your home's needs.
                        </p>
                    </div>

                    {/* Service Cards - Full Width */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {services.map((service) => {
                            const isPopular = service.slug === 'deep';

                            return (
                                <div
                                    key={service.id}
                                    className={`
                                        relative flex flex-col bg-white rounded-xl transition-all duration-300
                                        ${isPopular
                                            ? 'shadow-2xl ring-2 ring-primary scale-105 z-10'
                                            : 'shadow-lg hover:shadow-xl border border-gray-100 hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                            <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
                                        <p className="text-gray-500 text-xs mb-4 line-clamp-2">{service.description}</p>

                                        <div className="flex items-baseline mb-6">
                                            <span className="text-4xl font-bold text-gray-900 tracking-tight">
                                                ${service.basePrice}
                                            </span>
                                            <span className="text-gray-500 ml-1.5 text-sm font-medium">/ starting</span>
                                        </div>

                                        <ul className="space-y-2.5 mb-6">
                                            {service.inclusions.slice(0, 7).map((item, index) => (
                                                <li key={index} className="flex items-start text-xs group">
                                                    <div className="mr-2 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-700 leading-5">{item}</span>
                                                </li>
                                            ))}
                                            {service.inclusions.length > 7 && (
                                                <li className="text-xs text-primary font-medium pl-7">
                                                    + {service.inclusions.length - 7} more
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="p-6 pt-0 mt-auto">
                                        <button
                                            onClick={() => handleSelectService(service.id)}
                                            className={`
                                                w-full py-3 px-5 rounded-lg font-semibold text-sm transition-all transform active:scale-95
                                                ${isPopular
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/30'
                                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                }
                                            `}
                                        >
                                            Select {service.name}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => router.push('/')}
                            className="text-gray-500 hover:text-gray-900 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BookPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <BookPageContent />
        </Suspense>
    );
}
