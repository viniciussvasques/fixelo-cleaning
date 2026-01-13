'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function NewTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        subject: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create ticket');

            toast.success('Support ticket created successfully!');
            router.push('/cleaner/support');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/cleaner/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Create Support Ticket</h1>
                    <p className="text-gray-500">We're here to help</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BOOKING_ISSUE">Booking Issue</SelectItem>
                                    <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
                                    <SelectItem value="CLEANER_COMPLAINT">Complaint</SelectItem>
                                    <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
                                    <SelectItem value="ACCOUNT_ISSUE">Account Issue</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Brief description of the issue"
                                required
                                minLength={5}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Please provide details about your issue..."
                                required
                                minLength={20}
                                rows={6}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Ticket
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
