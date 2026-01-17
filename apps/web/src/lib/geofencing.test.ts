import { describe, it, expect } from 'vitest';
import { calculateDistance, isWithinCheckInRadius, formatDistance, getDirection, CHECK_IN_RADIUS } from './geofencing';

describe('Geofencing Library', () => {
    describe('calculateDistance', () => {
        it('should calculate distance between two points', () => {
            // Orlando to Tampa (closer cities, ~130 km)
            const distance = calculateDistance(
                28.5383, -81.3792,  // Orlando
                27.9506, -82.4572   // Tampa
            );

            // Should be approximately 130 km = 130000 meters
            expect(distance).toBeGreaterThan(100000);
            expect(distance).toBeLessThan(150000);
        });

        it('should return 0 for same location', () => {
            const distance = calculateDistance(
                28.5383, -81.3792,
                28.5383, -81.3792
            );

            expect(distance).toBe(0);
        });

        it('should handle negative coordinates', () => {
            const distance = calculateDistance(
                -33.8688, 151.2093,  // Sydney
                -37.8136, 144.9631   // Melbourne
            );

            // ~700-900 km in meters
            expect(distance).toBeGreaterThan(700000);
            expect(distance).toBeLessThan(900000);
        });
    });

    describe('isWithinCheckInRadius', () => {
        it('should return valid true when point is within radius', () => {
            const result = isWithinCheckInRadius(
                28.5383, -81.3792,  // Cleaner
                28.5384, -81.3793,  // Job (very close)
                150
            );

            expect(result.valid).toBe(true);
            expect(result.distance).toBeLessThan(150);
        });

        it('should return valid false when point is outside radius', () => {
            const result = isWithinCheckInRadius(
                28.5383, -81.3792,  // Cleaner
                28.5500, -81.4000,  // Job (far away)
                150
            );

            expect(result.valid).toBe(false);
            expect(result.distance).toBeGreaterThan(150);
        });

        it('should use default radius when not specified', () => {
            const result = isWithinCheckInRadius(
                28.5383, -81.3792,
                28.5383, -81.3792 // Same location
            );

            expect(result.valid).toBe(true);
            expect(result.maxDistance).toBe(CHECK_IN_RADIUS);
        });
    });

    describe('formatDistance', () => {
        it('should format meters correctly', () => {
            expect(formatDistance(100)).toBe('100m');
            expect(formatDistance(999)).toBe('999m');
        });

        it('should format kilometers correctly', () => {
            expect(formatDistance(1000)).toBe('1.0km');
            expect(formatDistance(2500)).toBe('2.5km');
        });
    });

    describe('getDirection', () => {
        it('should return "at location" for same point', () => {
            const direction = getDirection(28.5383, -81.3792, 28.5383, -81.3792);
            expect(direction).toBe('at location');
        });

        it('should return correct cardinal direction', () => {
            // Job is north of cleaner
            const north = getDirection(28.5383, -81.3792, 28.6000, -81.3792);
            expect(north).toBe('north');

            // Job is south of cleaner
            const south = getDirection(28.5383, -81.3792, 28.4000, -81.3792);
            expect(south).toBe('south');
        });
    });
});
