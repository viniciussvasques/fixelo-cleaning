'use client';

import React from 'react';
import { captureException } from '@/lib/sentry';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays fallback UI
 * while reporting errors to Sentry.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);

        // Report to Sentry
        captureException(error, {
            componentStack: errorInfo.componentStack,
        });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                        <div className="text-6xl mb-4">😔</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We're sorry, but something unexpected happened. Our team has been notified.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook to trigger error boundary for testing
 */
export function useErrorTrigger() {
    const [shouldError, setShouldError] = React.useState(false);

    if (shouldError) {
        throw new Error('Test error from useErrorTrigger');
    }

    return () => setShouldError(true);
}
