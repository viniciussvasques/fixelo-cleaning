/**
 * Centralized Price Calculator
 * 
 * Single source of truth for booking price calculations.
 * All booking pages should use this to ensure consistency.
 */

import { AddOn } from '@prisma/client';

export interface PricingDetails {
    basePrice: number;
    pricePerBed: number;
    pricePerBath: number;
    pricePerPet: number;
}

export interface HomeDetails {
    bedrooms: number;
    bathrooms: number;
    hasPets: boolean;
    squareFootage?: number;
}

export interface PriceBreakdown {
    basePrice: number;
    bedroomCharge: number;
    bathroomCharge: number;
    petCharge: number;
    addOnsTotal: number;
    subtotal: number;
    stripeFee: number;
    platformReserve: number;
    total: number;
}

/**
 * Calculate the complete price breakdown for a booking
 */
export function calculatePriceBreakdown(
    service: PricingDetails,
    homeDetails: HomeDetails,
    selectedAddOns: string[],
    availableAddOns: AddOn[]
): PriceBreakdown {
    // Base price from service
    const basePrice = service.basePrice || 0;

    // Extra room charges (first room is included in base price)
    const bedroomCharge = homeDetails.bedrooms > 1
        ? (homeDetails.bedrooms - 1) * (service.pricePerBed || 0)
        : 0;

    const bathroomCharge = homeDetails.bathrooms > 1
        ? (homeDetails.bathrooms - 1) * (service.pricePerBath || 0)
        : 0;

    // Pet fee
    const petCharge = homeDetails.hasPets ? (service.pricePerPet || 0) : 0;

    // Add-ons total - search by ID or slug
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
        const addOn = availableAddOns.find(a => a.id === addOnId || a.slug === addOnId);
        return total + (addOn?.price || 0);
    }, 0);

    // Calculate subtotal
    const subtotal = basePrice + bedroomCharge + bathroomCharge + petCharge + addOnsTotal;

    // Stripe fee (approximately 2.9% + $0.30)
    const stripeFee = subtotal * 0.029 + 0.30;

    // Platform reserve (2.5%)
    const platformReserve = subtotal * 0.025;

    // Total
    const total = subtotal + stripeFee + platformReserve;

    return {
        basePrice,
        bedroomCharge,
        bathroomCharge,
        petCharge,
        addOnsTotal,
        subtotal,
        stripeFee,
        platformReserve,
        total,
    };
}

/**
 * Simplified price calculation (just the total for display purposes)
 * Use this when you only need the total, not the full breakdown
 */
export function calculateTotalPrice(
    service: PricingDetails | null | undefined,
    homeDetails: HomeDetails | null | undefined,
    selectedAddOns: string[] = [],
    availableAddOns: AddOn[] = []
): number {
    if (!service || !homeDetails) return 0;

    // Base price from service
    let total = service.basePrice || 0;

    // Extra room charges (first room is included in base price)
    if (homeDetails.bedrooms > 1) {
        total += (homeDetails.bedrooms - 1) * (service.pricePerBed || 0);
    }

    if (homeDetails.bathrooms > 1) {
        total += (homeDetails.bathrooms - 1) * (service.pricePerBath || 0);
    }

    // Pet fee
    if (homeDetails.hasPets) {
        total += service.pricePerPet || 0;
    }

    // Add-ons - search by ID or slug
    selectedAddOns.forEach(addOnId => {
        const addOn = availableAddOns.find(a => a.id === addOnId || a.slug === addOnId);
        if (addOn) {
            total += addOn.price;
        }
    });

    return total;
}

/**
 * Type guard to extract pricing details from a ServiceType
 */
export function extractPricingDetails(service: any): PricingDetails {
    return {
        basePrice: service?.basePrice || 0,
        pricePerBed: service?.pricePerBed || 0,
        pricePerBath: service?.pricePerBath || 0,
        pricePerPet: service?.pricePerPet || 0,
    };
}
