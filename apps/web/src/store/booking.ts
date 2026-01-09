import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookingState {
    serviceId: string | null;
    homeDetails: {
        bedrooms: number;
        bathrooms: number;
        hasPets: boolean;
        squareFootage?: number;
    } | null;
    selectedDate: Date | null;
    selectedTimeSlot: string | null;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        unit?: string;
    } | null;
    specialInstructions: string | null;
    addOns: string[];
    setServiceId: (id: string) => void;
    setHomeDetails: (details: BookingState['homeDetails']) => void;
    setSelectedDate: (date: Date | null) => void;
    setSelectedTimeSlot: (slot: string | null) => void;
    setAddress: (address: BookingState['address']) => void;
    setSpecialInstructions: (instructions: string | null) => void;
    setAddOns: (addOns: string[]) => void;
    reset: () => void;
}

export const useBookingStore = create<BookingState>()(
    persist(
        (set) => ({
            serviceId: null,
            homeDetails: null,
            selectedDate: null,
            selectedTimeSlot: null,
            address: null,
            specialInstructions: null,
            addOns: [],
            setServiceId: (id) => set({ serviceId: id }),
            setHomeDetails: (details) => set({ homeDetails: details }),
            setSelectedDate: (date) => set({ selectedDate: date }),
            setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
            setAddress: (address) => set({ address }),
            setSpecialInstructions: (instructions) => set({ specialInstructions: instructions }),
            setAddOns: (addOns) => set({ addOns }),
            reset: () =>
                set({
                    serviceId: null,
                    homeDetails: null,
                    selectedDate: null,
                    selectedTimeSlot: null,
                    address: null,
                    specialInstructions: null,
                    addOns: [],
                }),
        }),
        {
            name: 'booking-storage',
        }
    )
);
