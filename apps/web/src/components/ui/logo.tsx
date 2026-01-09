import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    variant?: 'default' | 'white';
}

export function Logo({ className, variant: _variant = 'default' }: LogoProps) {
    return (
        <Link href="/" className={cn("flex items-center gap-2 transition-opacity hover:opacity-90", className)}>
            <Image
                src="/logo.svg"
                alt="Fixelo"
                width={140}
                height={35}
                className="h-8 sm:h-9 w-auto"
                priority
            />
        </Link>
    );
}
