/**
 * Geofencing Utilities
 * 
 * Validates cleaner location for check-in
 */

// Haversine formula to calculate distance between two points
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Check-in radius in meters
export const CHECK_IN_RADIUS = 150; // 150 meters

/**
 * Validate if cleaner is within acceptable distance of job location
 */
export function isWithinCheckInRadius(
    cleanerLat: number,
    cleanerLon: number,
    jobLat: number,
    jobLon: number,
    radiusMeters: number = CHECK_IN_RADIUS
): { valid: boolean; distance: number; maxDistance: number } {
    const distance = calculateDistance(cleanerLat, cleanerLon, jobLat, jobLon);
    
    return {
        valid: distance <= radiusMeters,
        distance: Math.round(distance),
        maxDistance: radiusMeters,
    };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get human-readable direction from cleaner to job
 */
export function getDirection(
    cleanerLat: number,
    cleanerLon: number,
    jobLat: number,
    jobLon: number
): string {
    const latDiff = jobLat - cleanerLat;
    const lonDiff = jobLon - cleanerLon;
    
    if (Math.abs(latDiff) < 0.0001 && Math.abs(lonDiff) < 0.0001) {
        return 'at location';
    }
    
    let direction = '';
    
    if (latDiff > 0.0001) direction += 'north';
    else if (latDiff < -0.0001) direction += 'south';
    
    if (lonDiff > 0.0001) direction += direction ? '-east' : 'east';
    else if (lonDiff < -0.0001) direction += direction ? '-west' : 'west';
    
    return direction || 'nearby';
}
