'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface AddressFormData {
    street: string;
    unit?: string | null;
    city: string;
    state: string;
    zipCode: string;
    accessInstructions?: string | null;
    isDefault: boolean;
}

interface AddressFormProps {
    address?: AddressFormData & { id: string };
    onSubmit: (data: AddressFormData) => Promise<void>;
    onCancel: () => void;
}

export default function AddressForm({ address, onSubmit, onCancel }: AddressFormProps) {
    const [formData, setFormData] = useState<AddressFormData>(address || {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        accessInstructions: '',
        isDefault: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit(formData);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save address';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {address ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Main St"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apartment/Unit (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.unit || ''}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Apt 4B"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Orlando"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={2}
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="FL"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code *
                        </label>
                        <input
                            type="text"
                            required
                            pattern="\d{5}(-\d{4})?"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="32801"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access Instructions (Optional)
                        </label>
                        <textarea
                            value={formData.accessInstructions || ''}
                            onChange={(e) => setFormData({ ...formData, accessInstructions: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Gate code, parking instructions, etc."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                            Set as default address
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
