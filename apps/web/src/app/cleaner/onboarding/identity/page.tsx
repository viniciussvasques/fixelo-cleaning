'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CreditCard, Calendar } from 'lucide-react';

const identitySchema = z.object({
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    ssnLast4: z.string().length(4, 'Enter last 4 digits of SSN'),
    photoIdType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID']),
});

type IdentityFormData = z.infer<typeof identitySchema>;

export default function IdentityStep() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idDocument, setIdDocument] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<IdentityFormData>({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            photoIdType: 'DRIVERS_LICENSE',
        }
    });

    const onSubmit = async (data: IdentityFormData) => {
        if (!idDocument) {
            toast.error('Please upload your ID document');
            return;
        }

        setIsSubmitting(true);
        try {
            // For MVP, we'll just store the metadata. Real upload would go to S3/Cloudinary
            const formData = new FormData();
            formData.append('dateOfBirth', data.dateOfBirth);
            formData.append('ssnLast4', data.ssnLast4);
            formData.append('photoIdType', data.photoIdType);
            formData.append('idDocument', idDocument);

            const response = await fetch('/api/cleaner/onboarding/identity', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save');
            }

            toast.success('Identity information saved!');
            router.push('/cleaner/onboarding/documents');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Identity Verification</h1>
                <p className="text-slate-600 mt-1">We need to verify your identity for safety</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            id="dateOfBirth"
                            type="date"
                            className="pl-10"
                            {...register('dateOfBirth')}
                        />
                    </div>
                    {errors.dateOfBirth && (
                        <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="ssnLast4">Last 4 Digits of SSN</Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            id="ssnLast4"
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            className="pl-10"
                            {...register('ssnLast4')}
                        />
                    </div>
                    {errors.ssnLast4 && (
                        <p className="text-sm text-red-500">{errors.ssnLast4.message}</p>
                    )}
                    <p className="text-xs text-slate-500">We only store the last 4 digits, encrypted</p>
                </div>

                <div className="space-y-2">
                    <Label>ID Document Type</Label>
                    <Select
                        defaultValue="DRIVERS_LICENSE"
                        onValueChange={(value) => setValue('photoIdType', value as any)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                            <SelectItem value="PASSPORT">Passport</SelectItem>
                            <SelectItem value="STATE_ID">State ID</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Upload ID Document</Label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${idDocument ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-300'
                            }`}
                        onClick={() => document.getElementById('idUpload')?.click()}
                    >
                        <input
                            id="idUpload"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                        />
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${idDocument ? 'text-green-600' : 'text-slate-400'}`} />
                        {idDocument ? (
                            <p className="text-green-700 font-medium">{idDocument.name}</p>
                        ) : (
                            <>
                                <p className="text-slate-600 font-medium">Click to upload</p>
                                <p className="text-xs text-slate-400">JPG, PNG, or PDF (max 5MB)</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/cleaner/onboarding/account')}
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
                            'Continue'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
