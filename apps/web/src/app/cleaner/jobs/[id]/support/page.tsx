'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, HelpCircle, Loader2, CheckCircle, AlertTriangle, Clock, DollarSign, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const TICKET_CATEGORIES = [
    { 
        id: 'BOOKING_ISSUE', 
        label: 'Booking Issue', 
        icon: Clock,
        description: 'Wrong address, scheduling conflict, etc.'
    },
    { 
        id: 'CUSTOMER_COMPLAINT', 
        label: 'Customer Problem', 
        icon: User,
        description: 'Customer not home, rude behavior, etc.'
    },
    { 
        id: 'PAYMENT_ISSUE', 
        label: 'Payment Issue', 
        icon: DollarSign,
        description: 'Missing payment, wrong amount, etc.'
    },
    { 
        id: 'SERVICE_QUALITY', 
        label: 'Property Issue', 
        icon: AlertTriangle,
        description: 'Damaged property, safety hazard, etc.'
    },
    { 
        id: 'TECHNICAL_ISSUE', 
        label: 'App Problem', 
        icon: Wrench,
        description: 'App not working, check-in issue, etc.'
    },
    { 
        id: 'OTHER', 
        label: 'Other', 
        icon: HelpCircle,
        description: 'Something else not listed'
    },
];

export default function JobSupportPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [ticketNumber, setTicketNumber] = useState('');

    const handleSubmit = async () => {
        if (!category || subject.length < 5 || description.length < 20) {
            toast.error('Please fill out all fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    subject,
                    description,
                    bookingId,
                    priority: category === 'PAYMENT_ISSUE' ? 'HIGH' : 'MEDIUM'
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create ticket');
            }

            setTicketNumber(data.ticket.ticketNumber);
            setStep(3);
            toast.success('Support ticket created!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Get Support</h1>
                    <p className="text-gray-500 text-sm">
                        Booking #{bookingId.slice(0, 8)}
                    </p>
                </div>
            </div>

            {/* Step 1: Select Category */}
            {step === 1 && (
                <div className="space-y-4">
                    <p className="text-gray-600">What type of issue are you having?</p>
                    <div className="grid gap-3">
                        {TICKET_CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setCategory(cat.id);
                                        setStep(2);
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left hover:border-primary ${
                                        category === cat.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{cat.label}</p>
                                        <p className="text-sm text-gray-500">{cat.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 2: Describe Issue */}
            {step === 2 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Describe the Issue</CardTitle>
                            <CardDescription>
                                Provide details so we can help you quickly
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief summary of the issue"
                                    maxLength={100}
                                />
                                <p className="text-xs text-gray-400 mt-1">{subject.length}/100</p>
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe the issue in detail. Include any relevant information like what happened, when it happened, etc."
                                    rows={6}
                                    maxLength={2000}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {description.length}/2000 (minimum 20 characters)
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                            Back
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={subject.length < 5 || description.length < 20 || submitting}
                            className="flex-1"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Ticket'
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <Card className="text-center py-8">
                    <CardContent className="space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Ticket Submitted!</h2>
                            <p className="text-gray-500 mt-1">
                                Your ticket number is: <strong>{ticketNumber}</strong>
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">
                            We'll review your issue and get back to you as soon as possible. 
                            You'll receive updates via email and in the app.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href="/cleaner/support">
                                    View My Tickets
                                </Link>
                            </Button>
                            <Button className="flex-1" asChild>
                                <Link href={`/cleaner/jobs/${bookingId}/execute`}>
                                    Back to Job
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Emergency Contact */}
            {step !== 3 && (
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800">Need immediate help?</p>
                                <p className="text-sm text-red-700">
                                    For emergencies or urgent safety concerns, call us directly:
                                </p>
                                <a href="tel:+1800FIXELO" className="text-red-800 font-bold text-lg">
                                    1-800-FIXELO
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
