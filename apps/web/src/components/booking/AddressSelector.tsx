'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Plus, Check } from 'lucide-react';

interface SavedAddress {
    id: string;
    street: string;
    unit?: string | null;
    city: string;
    state: string;
    zipCode: string;
    accessInstructions?: string | null;
    isDefault: boolean;
}

interface AddressSelectorProps {
    onSelect: (address: SavedAddress) => void;
    selectedAddressId?: string;
}

export default function AddressSelector({ onSelect, selectedAddressId }: AddressSelectorProps) {
    const { data: session } = useSession();
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [showNewForm, setShowNewForm] = useState(false);
    const [_isLoading, setIsLoading] = useState(true);

    const fetchAddresses = React.useCallback(async () => {
        try {
            const response = await fetch('/api/user/addresses');
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);

                // Auto-select default address if none selected
                if (!selectedAddressId && data.length > 0) {
                    const defaultAddr = data.find((a: SavedAddress) => a.isDefault) || data[0];
                    onSelect(defaultAddr);
                }
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAddressId, onSelect]);

    useEffect(() => {
        if (session?.user) {
            fetchAddresses();
        } else {
            setIsLoading(false);
        }
    }, [session, fetchAddresses]);

    // If not logged in or no addresses, show new form option
    if (!session?.user || addresses.length === 0) {
        return null; // Parent component handles new address form
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" />
                    {showNewForm ? 'Use Saved' : 'Add New'}
                </button>
            </div>

            {!showNewForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <button
                            key={address.id}
                            onClick={() => onSelect(address)}
                            className={`text-left p-4 border-2 rounded-lg transition-all ${selectedAddressId === address.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-gray-600" />
                                        {address.isDefault && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-medium text-gray-900">{address.street}</p>
                                    {address.unit && (
                                        <p className="text-sm text-gray-600">{address.unit}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                        {address.city}, {address.state} {address.zipCode}
                                    </p>
                                    {address.accessInstructions && (
                                        <p className="text-xs text-gray-500 mt-2">{address.accessInstructions}</p>
                                    )}
                                </div>
                                {selectedAddressId === address.id && (
                                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
