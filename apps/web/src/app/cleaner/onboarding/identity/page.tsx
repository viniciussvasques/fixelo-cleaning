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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CreditCard, Calendar, Building2, User } from 'lucide-react';

const identitySchema = z.object({
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    businessType: z.enum(['INDIVIDUAL', 'COMPANY']),
    taxIdType: z.enum(['SSN', 'ITIN', 'EIN']),
    taxIdValue: z.string().min(4, 'Tax ID is required'),
    photoIdType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID']),
}).refine((data) => {
    // EIN only valid for COMPANY
    if (data.taxIdType === 'EIN' && data.businessType !== 'COMPANY') {
        return false;
    }
    // SSN and ITIN only for INDIVIDUAL
    if ((data.taxIdType === 'SSN' || data.taxIdType === 'ITIN') && data.businessType === 'COMPANY') {
        return false;
    }
    return true;
}, {
    message: 'Invalid tax ID type for business type',
    path: ['taxIdType'],
});

type IdentityFormData = z.infer<typeof identitySchema>;

export default function IdentityStep() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idDocument, setIdDocument] = useState<File | null>(null);
    const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<IdentityFormData>({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            businessType: 'INDIVIDUAL',
            taxIdType: 'SSN',
            photoIdType: 'DRIVERS_LICENSE',
        }
    });

    const selectedTaxIdType = watch('taxIdType');

    const handleBusinessTypeChange = (value: 'INDIVIDUAL' | 'COMPANY') => {
        setBusinessType(value);
        setValue('businessType', value);
        // Set appropriate default tax ID type
        if (value === 'COMPANY') {
            setValue('taxIdType', 'EIN');
        } else {
            setValue('taxIdType', 'SSN');
        }
    };

    const onSubmit = async (data: IdentityFormData) => {
        if (!idDocument) {
            toast.error('Please upload your ID document');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('dateOfBirth', data.dateOfBirth);
            formData.append('businessType', data.businessType);
            formData.append('taxIdType', data.taxIdType);
            formData.append('taxIdValue', data.taxIdValue);
            formData.append('photoIdType', data.photoIdType);
            formData.append('idDocument', idDocument);

            const response = await fetch('/api/cleaner/onboarding/identity', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to save');
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
                {/* Business Type Selection */}
                <div className="space-y-3">
                    <Label>Are you registering as:</Label>
                    <RadioGroup
                        defaultValue="INDIVIDUAL"
                        onValueChange={(value) => handleBusinessTypeChange(value as 'INDIVIDUAL' | 'COMPANY')}
                        className="grid grid-cols-2 gap-4"
                    >
                        <Label
                            htmlFor="individual"
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${businessType === 'INDIVIDUAL'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <RadioGroupItem value="INDIVIDUAL" id="individual" className="sr-only" />
                            <User className={`w-8 h-8 mb-2 ${businessType === 'INDIVIDUAL' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="font-medium">Individual</span>
                            <span className="text-xs text-slate-500">Self-employed</span>
                        </Label>
                        <Label
                            htmlFor="company"
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${businessType === 'COMPANY'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <RadioGroupItem value="COMPANY" id="company" className="sr-only" />
                            <Building2 className={`w-8 h-8 mb-2 ${businessType === 'COMPANY' ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="font-medium">Business</span>
                            <span className="text-xs text-slate-500">LLC, Corp, etc.</span>
                        </Label>
                    </RadioGroup>
                </div>

                {/* Date of Birth */}
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

                {/* Tax ID Type Selection (for Individual) */}
                {businessType === 'INDIVIDUAL' && (
                    <div className="space-y-2">
                        <Label>Tax ID Type</Label>
                        <RadioGroup
                            defaultValue="SSN"
                            onValueChange={(value: string) => setValue('taxIdType', value as 'SSN' | 'ITIN')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="SSN" id="ssn" />
                                <Label htmlFor="ssn" className="cursor-pointer">SSN</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ITIN" id="itin" />
                                <Label htmlFor="itin" className="cursor-pointer">ITIN</Label>
                            </div>
                        </RadioGroup>
                        <p className="text-xs text-slate-500">
                            {selectedTaxIdType === 'SSN'
                                ? 'Social Security Number (for US citizens/residents)'
                                : 'Individual Taxpayer Identification Number (for non-residents)'}
                        </p>
                    </div>
                )}

                {/* Tax ID Value */}
                <div className="space-y-2">
                    <Label htmlFor="taxIdValue">
                        {businessType === 'COMPANY'
                            ? 'EIN (Employer Identification Number)'
                            : selectedTaxIdType === 'SSN'
                                ? 'Last 4 Digits of SSN'
                                : 'ITIN Number'}
                    </Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            id="taxIdValue"
                            type={businessType === 'INDIVIDUAL' ? 'password' : 'text'}
                            maxLength={businessType === 'COMPANY' ? 10 : 4}
                            placeholder={businessType === 'COMPANY' ? 'XX-XXXXXXX' : '••••'}
                            className="pl-10"
                            {...register('taxIdValue')}
                        />
                    </div>
                    {errors.taxIdValue && (
                        <p className="text-sm text-red-500">{errors.taxIdValue.message}</p>
                    )}
                    <p className="text-xs text-slate-500">
                        {businessType === 'COMPANY'
                            ? 'Enter your 9-digit EIN'
                            : 'We only store the last 4 digits, encrypted'}
                    </p>
                </div>

                {/* Photo ID Type */}
                <div className="space-y-2">
                    <Label>ID Document Type</Label>
                    <Select
                        defaultValue="DRIVERS_LICENSE"
                        onValueChange={(value: string) => setValue('photoIdType', value as 'DRIVERS_LICENSE' | 'PASSPORT' | 'STATE_ID')}
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

                {/* File Upload */}
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

