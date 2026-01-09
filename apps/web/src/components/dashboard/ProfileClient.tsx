'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import AddressForm, { AddressFormData } from '@/components/dashboard/AddressForm';

interface Address {
    id: string;
    street: string;
    unit?: string | null;
    city: string;
    state: string;
    zipCode: string;
    accessInstructions?: string | null;
    isDefault: boolean;
}

interface ProfileClientProps {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
    };
    addresses: Address[];
}

export default function ProfileClient({ user, addresses: initialAddresses }: ProfileClientProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addresses, setAddresses] = useState(initialAddresses);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
    });
    const [error, setError] = useState('');

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            setIsEditing(false);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddressSubmit = async (data: AddressFormData) => {
        const url = editingAddress
            ? `/api/user/addresses/${editingAddress.id}`
            : '/api/user/addresses';
        const method = editingAddress ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save address');
        }

        const savedAddress = await response.json();

        if (editingAddress) {
            setAddresses(addresses.map(a => a.id === savedAddress.id ? savedAddress : a));
        } else {
            setAddresses([...addresses, savedAddress]);
        }

        setShowAddressForm(false);
        setEditingAddress(null);
        router.refresh();
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const response = await fetch(`/api/user/addresses/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete address');
            }

            setAddresses(addresses.filter(a => a.id !== id));
            router.refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="inline h-4 w-4 mr-2" />
                                First Name
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="inline h-4 w-4 mr-2" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                        <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="inline h-4 w-4 mr-2" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>

                    {isEditing && (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        phone: user.phone || '',
                                    });
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Saved Addresses */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            + Add Address
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {addresses.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-gray-600">No saved addresses yet</p>
                            <p className="text-sm text-gray-500">Add an address to speed up booking</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {addresses.map((address) => (
                                <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{address.street}</p>
                                                {address.isDefault && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            {address.unit && (
                                                <p className="text-sm text-gray-600">{address.unit}</p>
                                            )}
                                            <p className="text-sm text-gray-600">
                                                {address.city}, {address.state} {address.zipCode}
                                            </p>
                                            {address.accessInstructions && (
                                                <p className="text-sm text-gray-500 mt-2">{address.accessInstructions}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingAddress(address);
                                                    setShowAddressForm(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAddress(address.id)}
                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Address Form Modal */}
            {showAddressForm && (
                <AddressForm
                    address={editingAddress || undefined}
                    onSubmit={handleAddressSubmit}
                    onCancel={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                    }}
                />
            )}
        </div>
    );
}
