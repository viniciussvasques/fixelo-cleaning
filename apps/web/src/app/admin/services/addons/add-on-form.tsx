"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddOn } from "@prisma/client";
import { createAddOn, updateAddOn } from "./actions";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : isEditing ? "Update Add-on" : "Create Add-on"}
        </Button>
    );
}

interface AddOnFormProps {
    addOn?: AddOn;
}

export default function AddOnForm({ addOn }: AddOnFormProps) {
    const isEditing = !!addOn;
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    async function handleSubmit(formData: FormData) {
        const action = isEditing ? updateAddOn.bind(null, addOn!.id) : createAddOn;

        setErrors({});

        const result = await action(formData);

        if (result && result.error) {
            if (typeof result.error === 'string') {
                alert(result.error);
            } else {
                setErrors(result.error as Record<string, string[]>);
            }
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={addOn?.name}
                        required
                        placeholder="e.g. Inside Oven"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL friendly)</Label>
                    <Input
                        id="slug"
                        name="slug"
                        defaultValue={addOn?.slug}
                        required
                        placeholder="e.g. inside-oven"
                    />
                    {errors.slug && <p className="text-red-500 text-sm">{errors.slug[0]}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={addOn?.description || ''}
                    rows={3}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={addOn?.price}
                        required
                    />
                    {errors.price && <p className="text-red-500 text-sm">{errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timeAdded">Time Added (min)</Label>
                    <Input
                        id="timeAdded"
                        name="timeAdded"
                        type="number"
                        defaultValue={addOn?.timeAdded}
                        required
                    />
                    {errors.timeAdded && <p className="text-red-500 text-sm">{errors.timeAdded[0]}</p>}
                </div>
                <div className="flex items-center space-x-2 pt-8">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        defaultChecked={addOn?.isActive ?? true}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isActive">Active</Label>
                </div>
            </div>

            <SubmitButton isEditing={isEditing} />
        </form>
    );
}
