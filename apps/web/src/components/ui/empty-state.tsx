import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, icon, title, description, action, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex flex-col items-center justify-center py-12 px-4 text-center',
                    className
                )}
                {...props}
            >
                {icon && (
                    <div className="mb-4 text-muted-foreground opacity-50">
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        {description}
                    </p>
                )}
                {action && <div className="mt-2">{action}</div>}
            </div>
        );
    }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
