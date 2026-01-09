import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        direction: 'up' | 'down';
    };
    description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
    ({ className, title, value, icon, trend, description, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'card p-6 hover:shadow-md transition-shadow',
                    className
                )}
                {...props}
            >
                <div className="flex items-center justify-between mb-4">
                    {icon && (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                    {trend && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-sm font-medium',
                                trend.direction === 'up'
                                    ? 'text-success'
                                    : 'text-error'
                            )}
                        >
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
        );
    }
);
StatCard.displayName = 'StatCard';

export { StatCard };
