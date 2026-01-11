import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOOKING_STEPS = [
    { id: 1, name: 'Service', path: '/book' },
    { id: 2, name: 'Details', path: '/book/details' },
    { id: 3, name: 'Schedule', path: '/book/schedule' },
    { id: 4, name: 'Account', path: '/book/auth' },
    { id: 5, name: 'Address', path: '/book/address' },
    { id: 6, name: 'Review', path: '/book/review' },
];

interface BookingProgressProps {
    currentStep: number;
}

export function BookingProgress({ currentStep }: BookingProgressProps) {
    return (
        <div className="w-full py-4 px-4 bg-white border-b">
            <div className="max-w-3xl mx-auto">
                {/* Mobile: Simplified view */}
                <div className="sm:hidden flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                        Step {currentStep} of {BOOKING_STEPS.length}
                    </span>
                    <span className="text-sm text-gray-500">
                        {BOOKING_STEPS[currentStep - 1]?.name}
                    </span>
                </div>

                {/* Desktop: Full progress bar */}
                <div className="hidden sm:flex items-center justify-between">
                    {BOOKING_STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                        currentStep > step.id
                                            ? 'bg-blue-600 text-white'
                                            : currentStep === step.id
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                : 'bg-gray-200 text-gray-500'
                                    )}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'mt-1 text-xs font-medium',
                                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                                    )}
                                >
                                    {step.name}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < BOOKING_STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'w-8 lg:w-12 h-0.5 mx-1',
                                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export { BOOKING_STEPS };
