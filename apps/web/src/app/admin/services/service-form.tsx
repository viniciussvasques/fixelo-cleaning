"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceType } from "@prisma/client";
import { createService, updateService } from "./actions";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
        </Button>
    );
}

interface ServiceFormProps {
    service?: ServiceType;
}

export default function ServiceForm({ service }: ServiceFormProps) {
    const isEditing = !!service;
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // Client-side wrapper to handle server action response
    async function handleSubmit(formData: FormData) {
        const action = isEditing ? updateService.bind(null, service!.id) : createService;

        // reset errors
        setErrors({});

        const result = await action(formData);

        if (result && result.error) {
            // If string error
            if (typeof result.error === 'string') {
                alert(result.error);
            } else {
                // Field errors
                setErrors(result.error as Record<string, string[]>);
            }
        }
        // If successful, the server action redirects, so we don't need to do anything here usually.
    }

    // Helper to join array to string for textareas
    const inclusionsText = Array.isArray(service?.inclusions)
        ? (service?.inclusions as string[]).join('\n')
        : '';
    const exclusionsText = Array.isArray(service?.exclusions)
        ? (service?.exclusions as string[]).join('\n')
        : '';

    return (
        <form action={handleSubmit} className="space-y-8 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={service?.name}
                        required
                        placeholder="e.g. Standard Cleaning"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL friendly)</Label>
                    <Input
                        id="slug"
                        name="slug"
                        defaultValue={service?.slug}
                        required
                        placeholder="e.g. standard-cleaning"
                    />
                    {errors.slug && <p className="text-red-500 text-sm">{errors.slug[0]}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={service?.description || ''}
                    rows={3}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price ($)</Label>
                    <Input
                        id="basePrice"
                        name="basePrice"
                        type="number"
                        step="0.01"
                        defaultValue={service?.basePrice}
                        required
                    />
                    {errors.basePrice && <p className="text-red-500 text-sm">{errors.basePrice[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="baseTime">Base Duration (min)</Label>
                    <Input
                        id="baseTime"
                        name="baseTime"
                        type="number"
                        defaultValue={service?.baseTime}
                        required
                    />
                    {errors.baseTime && <p className="text-red-500 text-sm">{errors.baseTime[0]}</p>}
                </div>
                <div className="flex items-center space-x-2 pt-8">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        defaultChecked={service?.isActive ?? true}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isActive">Active</Label>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="timePerBed">+Time per Bedroom (min)</Label>
                    <Input
                        id="timePerBed"
                        name="timePerBed"
                        type="number"
                        defaultValue={service?.timePerBed}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timePerBath">+Time per Bathroom (min)</Label>
                    <Input
                        id="timePerBath"
                        name="timePerBath"
                        type="number"
                        defaultValue={service?.timePerBath}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="pricePerBed">+Price per Bedroom ($)</Label>
                    <Input
                        id="pricePerBed"
                        name="pricePerBed"
                        type="number"
                        step="0.01"
                        defaultValue={(service as any)?.pricePerBed ?? 20}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pricePerBath">+Price per Bathroom ($)</Label>
                    <Input
                        id="pricePerBath"
                        name="pricePerBath"
                        type="number"
                        step="0.01"
                        defaultValue={(service as any)?.pricePerBath ?? 25}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pricePerPet">+Price per Pet ($)</Label>
                    <Input
                        id="pricePerPet"
                        name="pricePerPet"
                        type="number"
                        step="0.01"
                        defaultValue={(service as any)?.pricePerPet ?? 15}
                        required
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="inclusions">Inclusions (one per line)</Label>
                    <Textarea
                        id="inclusions"
                        name="inclusions"
                        defaultValue={inclusionsText}
                        rows={5}
                        placeholder="Dusting&#10;Vacuuming&#10;Moping"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="exclusions">Exclusions (one per line)</Label>
                    <Textarea
                        id="exclusions"
                        name="exclusions"
                        defaultValue={exclusionsText}
                        rows={5}
                        placeholder="Inside Oven&#10;Inside Fridge"
                    />
                </div>
            </div>

            <SubmitButton isEditing={isEditing} />
        </form>
    );
}
