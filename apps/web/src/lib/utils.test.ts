import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatTime } from './utils';

describe('Utils Library', () => {
    describe('cn (classnames)', () => {
        it('should merge class names', () => {
            const result = cn('bg-blue-500', 'text-white');
            expect(result).toContain('bg-blue-500');
            expect(result).toContain('text-white');
        });

        it('should handle conditional classes', () => {
            const isActive = true;
            const result = cn('base', isActive && 'active');
            expect(result).toContain('base');
            expect(result).toContain('active');
        });

        it('should handle falsy values', () => {
            const result = cn('base', false && 'hidden', null, undefined);
            expect(result).toBe('base');
        });

        it('should merge tailwind classes correctly', () => {
            const result = cn('px-4', 'px-6');
            // tailwind-merge should keep only the last one
            expect(result).toContain('px-6');
            expect(result).not.toContain('px-4');
        });
    });

    describe('formatCurrency', () => {
        it('should format positive amounts', () => {
            const result = formatCurrency(1234.56);
            expect(result).toBe('$1,234.56');
        });

        it('should format zero', () => {
            const result = formatCurrency(0);
            expect(result).toBe('$0.00');
        });

        it('should handle negative amounts', () => {
            const result = formatCurrency(-50);
            expect(result).toBe('-$50.00');
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2024-03-15');
            const result = formatDate(date);
            expect(result).toContain('March');
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });

        it('should handle string dates', () => {
            const result = formatDate('2024-03-15');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });
    });

    describe('formatTime', () => {
        it('should format time correctly', () => {
            const date = new Date('2024-03-15T14:30:00');
            const result = formatTime(date);
            expect(result).toContain(':30');
            expect(result).toMatch(/AM|PM/i);
        });

        it('should handle morning times', () => {
            const date = new Date('2024-03-15T09:15:00');
            const result = formatTime(date);
            expect(result).toContain('9:15');
            expect(result).toContain('AM');
        });
    });
});
