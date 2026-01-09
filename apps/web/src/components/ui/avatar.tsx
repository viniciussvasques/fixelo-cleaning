import * as React from 'react';
import { cn } from '@/lib/utils';

import Image from 'next/image';

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
            className
        )}
        {...props}
    />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt, ...props }, _ref) => {
    // Destructure to remove width/height when using fill
    const { width: _w, height: _h, ...rest } = props;
    return (
        <Image
            src={src || ''}
            alt={alt || 'Avatar'}
            fill
            className={cn('aspect-square h-full w-full object-cover', className)}
            {...(rest as Record<string, unknown>)}
        />
    );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold',
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
