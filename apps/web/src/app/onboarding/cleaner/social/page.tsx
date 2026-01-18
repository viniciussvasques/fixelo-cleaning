'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Linkedin, Instagram, Globe, Plus, Trash2, UserCheck } from 'lucide-react';

const referenceSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Valid phone required'),
    relationship: z.string().min(2, 'Relationship is required'),
});

const socialSchema = z.object({
    linkedinProfile: z.string().url().optional().or(z.literal('')),
    instagramHandle: z.string().optional(),
    websiteUrl: z.string().url().optional().or(z.literal('')),
    references: z.array(referenceSchema).min(2, 'At least 2 references required'),
});

type SocialFormData = z.infer<typeof socialSchema>;

export default function SocialStep() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<SocialFormData>({
        resolver: zodResolver(socialSchema),
        defaultValues: {
            linkedinProfile: '',
            instagramHandle: '',
            websiteUrl: '',
            references: [
                { name: '', phone: '', relationship: '' },
                { name: '', phone: '', relationship: '' },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'references',
    });

    const onSubmit = async (data: SocialFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/cleaner/onboarding/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save');
            }

            toast.success('Social information saved!');
            router.push('/cleaner/onboarding/banking');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Social & References</h1>
                <p className="text-slate-600 mt-1">Help us verify your professional reputation</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
                {/* Social Media */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-slate-800">Social Profiles (Optional)</h2>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-blue-700" />
                            LinkedIn
                        </Label>
                        <Input
                            placeholder="https://linkedin.com/in/yourprofile"
                            {...register('linkedinProfile')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-pink-600" />
                            Instagram
                        </Label>
                        <Input
                            placeholder="@yourhandle"
                            {...register('instagramHandle')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-600" />
                            Website
                        </Label>
                        <Input
                            placeholder="https://yourwebsite.com"
                            {...register('websiteUrl')}
                        />
                    </div>
                </div>

                {/* Professional References */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-green-600" />
                            Professional References
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: '', phone: '', relationship: '' })}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </Button>
                    </div>
                    <p className="text-sm text-slate-500">Minimum 2 references required. We may contact them to verify.</p>

                    {errors.references?.root && (
                        <p className="text-sm text-red-500">{errors.references.root.message}</p>
                    )}

                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-xl space-y-3 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600">Reference {index + 1}</span>
                                {fields.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                            <Input
                                placeholder="Full Name"
                                {...register(`references.${index}.name`)}
                            />
                            {errors.references?.[index]?.name && (
                                <p className="text-xs text-red-500">{errors.references[index]?.name?.message}</p>
                            )}
                            <Input
                                placeholder="Phone Number"
                                {...register(`references.${index}.phone`)}
                            />
                            <Input
                                placeholder="Relationship (e.g., Former Client)"
                                {...register(`references.${index}.relationship`)}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/cleaner/onboarding/documents')}
                    >
                        Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Continue to Banking'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
