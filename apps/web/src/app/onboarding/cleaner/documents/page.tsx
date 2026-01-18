'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileCheck, Shield, Award } from 'lucide-react';

export default function DocumentsStep() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            if (insuranceDoc) {
                formData.append('insuranceDoc', insuranceDoc);
            }

            const response = await fetch('/api/cleaner/onboarding/documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save');
            }

            toast.success('Documents saved!');
            router.push('/cleaner/onboarding/social');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Professional Documents</h1>
                <p className="text-slate-600 mt-1">Optional but recommended for trust badges</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6 max-w-md mx-auto">
                {/* Insurance Document */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Liability Insurance (Optional)
                    </Label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${insuranceDoc ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-300'
                            }`}
                        onClick={() => document.getElementById('insuranceUpload')?.click()}
                    >
                        <input
                            id="insuranceUpload"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => setInsuranceDoc(e.target.files?.[0] || null)}
                        />
                        {insuranceDoc ? (
                            <>
                                <FileCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                <p className="text-green-700 font-medium">{insuranceDoc.name}</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                <p className="text-slate-600 font-medium">Upload insurance certificate</p>
                                <p className="text-xs text-slate-400">Earns you a 🛡️ Insured badge</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Trust Badges Preview */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-3">Badges you can earn:</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium border">
                            <Shield className="w-3 h-3 text-blue-600" />
                            Insured
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium border">
                            <Award className="w-3 h-3 text-purple-600" />
                            Certified
                        </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/cleaner/onboarding/identity')}
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

                <p className="text-center text-xs text-slate-500">
                    You can skip this step and add documents later
                </p>
            </form>
        </div>
    );
}
