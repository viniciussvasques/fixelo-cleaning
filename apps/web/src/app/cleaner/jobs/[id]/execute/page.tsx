'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    CheckCircle, 
    Camera, 
    MessageCircle, 
    Clock, 
    MapPin,
    ChevronRight,
    Loader2,
    AlertCircle,
    Phone,
    Navigation,
    Home,
    List,
    Image as ImageIcon,
    CheckSquare,
    Square,
    HelpCircle,
    Play,
    Flag,
    Timer,
    Star,
    Ban,
    FileText,
    StickyNote,
    Send,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface JobExecution {
    id: string;
    bookingId: string;
    status: 'NOT_STARTED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED';
    checkedInAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    photos: Photo[];
    checklist: ChecklistItem[];
    booking: {
        id: string;
        scheduledDate: string;
        timeWindow: string;
        estimatedDuration: number;
        bedrooms: number;
        bathrooms: number;
        specialInstructions: string | null;
        serviceType: {
            name: string;
        };
        user: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            email: string;
        };
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
        } | null;
    };
    progress: {
        checklist: number;
        beforePhotos: number;
        afterPhotos: number;
        requiredBeforePhotos: number;
        requiredAfterPhotos: number;
    };
}

interface Photo {
    id: string;
    type: 'BEFORE' | 'AFTER';
    url: string;
    room: string | null;
    createdAt: string;
}

interface ChecklistItem {
    id: string;
    category: string;
    task: string;
    isRequired: boolean;
    completed: boolean;
    notes: string | null;
}

export default function JobExecutionPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    
    const [execution, setExecution] = useState<JobExecution | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Timer effect
    useEffect(() => {
        if (!execution) return;
        
        const startTime = execution.startedAt 
            ? new Date(execution.startedAt).getTime() 
            : null;
        
        if (!startTime || execution.status === 'COMPLETED') return;

        const timer = setInterval(() => {
            const now = Date.now();
            setElapsedTime(Math.floor((now - startTime) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [execution?.startedAt, execution?.status]);

    // Format timer display
    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchExecution = useCallback(async () => {
        try {
            const res = await fetch(`/api/cleaner/jobs/${bookingId}/execution`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setExecution(data);
        } catch (err) {
            toast.error('Failed to load job details');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchExecution();
    }, [fetchExecution]);

    const handleAction = async (action: string) => {
        setActionLoading(true);
        try {
            // Get location for check-in/complete
            let latitude, longitude;
            if (navigator.geolocation && (action === 'CHECK_IN' || action === 'COMPLETE')) {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                }).catch(() => null);
                
                if (position) {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                }
            }

            const res = await fetch(`/api/cleaner/jobs/${bookingId}/execution`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, latitude, longitude })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Action failed');
            }

            toast.success(data.message || 'Success!');
            await fetchExecution();

            if (action === 'COMPLETE') {
                router.push('/cleaner/jobs');
            }
        } catch (err: any) {
            toast.error(err.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleChecklist = async (itemId: string, completed: boolean) => {
        try {
            const res = await fetch(`/api/cleaner/jobs/${bookingId}/checklist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, completed })
            });

            if (!res.ok) throw new Error('Failed to update');
            await fetchExecution();
        } catch (err) {
            toast.error('Failed to update checklist');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!execution) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold">Job not found</h2>
                <Link href="/cleaner/jobs" className="text-primary mt-2 inline-block">
                    Back to Jobs
                </Link>
            </div>
        );
    }

    const { booking, progress, status } = execution;
    const customer = booking.user;
    const address = booking.address;

    // Status-based UI
    const getStatusColor = () => {
        switch (status) {
            case 'NOT_STARTED': return 'bg-gray-100 text-gray-700';
            case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'COMPLETED': return 'bg-green-100 text-green-700';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'NOT_STARTED': return 'Not Started';
            case 'CHECKED_IN': return 'Checked In';
            case 'IN_PROGRESS': return 'In Progress';
            case 'COMPLETED': return 'Completed';
        }
    };

    // Group checklist by category
    const checklistByCategory = execution.checklist.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    return (
        <div className="space-y-4 pb-32 lg:pb-4">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{booking.serviceType.name}</h1>
                    <p className="text-sm sm:text-base text-gray-500">
                        {new Date(booking.scheduledDate).toLocaleDateString(undefined, { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                        })} • {booking.timeWindow}
                    </p>
                </div>
                <Badge className={`${getStatusColor()} shrink-0`}>{getStatusLabel()}</Badge>
            </div>

            {/* Timer Display (when job is in progress) */}
            {status === 'IN_PROGRESS' && (
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Timer className="w-6 h-6 text-blue-600 animate-pulse" />
                    <div className="text-center">
                        <p className="text-sm text-blue-600 font-medium">Time Elapsed</p>
                        <p className="text-3xl font-mono font-bold text-blue-700">{formatTime(elapsedTime)}</p>
                    </div>
                    <div className="text-center ml-4">
                        <p className="text-sm text-gray-500">Estimated</p>
                        <p className="text-lg font-medium">{booking.estimatedDuration} min</p>
                    </div>
                </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {customer.phone && (
                    <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${customer.phone}`}>
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/cleaner/jobs/${bookingId}/chat`}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                    </Link>
                </Button>
                {address && (
                    <Button variant="outline" size="sm" asChild>
                        <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zip}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowNoteModal(true)}>
                    <StickyNote className="w-4 h-4 mr-1" />
                    Note
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/cleaner/jobs/${bookingId}/support`}>
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Support
                    </Link>
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">
                        <Home className="w-4 h-4 mr-1 hidden sm:inline" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="checklist">
                        <List className="w-4 h-4 mr-1 hidden sm:inline" />
                        Checklist
                    </TabsTrigger>
                    <TabsTrigger value="before">
                        <ImageIcon className="w-4 h-4 mr-1 hidden sm:inline" />
                        Before
                    </TabsTrigger>
                    <TabsTrigger value="after">
                        <ImageIcon className="w-4 h-4 mr-1 hidden sm:inline" />
                        After
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Customer & Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                            {address && (
                                <p className="text-sm text-gray-600">
                                    {address.street}<br />
                                    {address.city}, {address.state} {address.zip}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Job Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Job Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{booking.bedrooms}</p>
                                    <p className="text-xs text-gray-500">Bedrooms</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{booking.bathrooms}</p>
                                    <p className="text-xs text-gray-500">Bathrooms</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{booking.estimatedDuration}</p>
                                    <p className="text-xs text-gray-500">Est. Minutes</p>
                                </div>
                            </div>
                            {booking.specialInstructions && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                    <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                                    <p className="text-sm text-yellow-700">{booking.specialInstructions}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Checklist</span>
                                    <span>{progress.checklist}%</span>
                                </div>
                                <Progress value={progress.checklist} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Before Photos</span>
                                    <span>{progress.beforePhotos}/{progress.requiredBeforePhotos}</span>
                                </div>
                                <Progress 
                                    value={(progress.beforePhotos / progress.requiredBeforePhotos) * 100} 
                                    className="h-2" 
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>After Photos</span>
                                    <span>{progress.afterPhotos}/{progress.requiredAfterPhotos}</span>
                                </div>
                                <Progress 
                                    value={(progress.afterPhotos / progress.requiredAfterPhotos) * 100} 
                                    className="h-2" 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Checklist Tab */}
                <TabsContent value="checklist" className="space-y-4">
                    {Object.entries(checklistByCategory).map(([category, items]) => (
                        <Card key={category}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{category}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleToggleChecklist(item.id, !item.completed)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                            item.completed 
                                                ? 'bg-green-50 text-green-700' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        disabled={status === 'NOT_STARTED'}
                                    >
                                        {item.completed ? (
                                            <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm text-left flex-1 ${item.completed ? 'line-through' : ''}`}>
                                            {item.task}
                                        </span>
                                        {item.isRequired && !item.completed && (
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        )}
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                    
                    {execution.checklist.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No checklist items</p>
                        </div>
                    )}
                </TabsContent>

                {/* Before Photos Tab */}
                <TabsContent value="before">
                    <PhotoUploadSection 
                        bookingId={bookingId}
                        type="BEFORE"
                        photos={execution.photos.filter(p => p.type === 'BEFORE')}
                        required={progress.requiredBeforePhotos}
                        disabled={status === 'NOT_STARTED'}
                        onUpload={fetchExecution}
                    />
                </TabsContent>

                {/* After Photos Tab */}
                <TabsContent value="after">
                    <PhotoUploadSection 
                        bookingId={bookingId}
                        type="AFTER"
                        photos={execution.photos.filter(p => p.type === 'AFTER')}
                        required={progress.requiredAfterPhotos}
                        disabled={status !== 'IN_PROGRESS'}
                        onUpload={fetchExecution}
                    />
                </TabsContent>
            </Tabs>

            {/* Fixed Action Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-bottom lg:left-64">
                <div className="max-w-2xl mx-auto">
                    {status === 'NOT_STARTED' && (
                        <Button 
                            onClick={() => handleAction('CHECK_IN')}
                            className="w-full h-14 text-lg"
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <MapPin className="w-5 h-5 mr-2" />
                            )}
                            Check In - I've Arrived
                        </Button>
                    )}
                    
                    {status === 'CHECKED_IN' && (
                        <Button 
                            onClick={() => handleAction('START')}
                            className="w-full h-14 text-lg"
                            disabled={actionLoading || progress.beforePhotos < progress.requiredBeforePhotos}
                        >
                            {actionLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Play className="w-5 h-5 mr-2" />
                            )}
                            Start Cleaning
                            {progress.beforePhotos < progress.requiredBeforePhotos && (
                                <span className="text-xs ml-2 opacity-80">
                                    ({progress.beforePhotos}/{progress.requiredBeforePhotos} photos)
                                </span>
                            )}
                        </Button>
                    )}
                    
                    {status === 'IN_PROGRESS' && (
                        <Button 
                            onClick={() => handleAction('COMPLETE')}
                            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                            disabled={
                                actionLoading || 
                                progress.afterPhotos < progress.requiredAfterPhotos ||
                                progress.checklist < 100
                            }
                        >
                            {actionLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Flag className="w-5 h-5 mr-2" />
                            )}
                            Complete Job
                            {(progress.afterPhotos < progress.requiredAfterPhotos || progress.checklist < 100) && (
                                <span className="text-xs ml-2 opacity-80">
                                    (Photos: {progress.afterPhotos}/{progress.requiredAfterPhotos}, Tasks: {progress.checklist}%)
                                </span>
                            )}
                        </Button>
                    )}
                    
                    {status === 'COMPLETED' && (
                        <div className="space-y-3">
                            {/* Post-job actions */}
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowRatingModal(true)}
                                >
                                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                                    Rate Client
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/cleaner/jobs/${bookingId}/report`, { method: 'POST' });
                                            const data = await res.json();
                                            if (res.ok) {
                                                toast.success(data.message || 'Report sent!');
                                            } else {
                                                throw new Error(data.error);
                                            }
                                        } catch (err: any) {
                                            toast.error(err.message || 'Failed to send report');
                                        }
                                    }}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Report
                                </Button>
                            </div>
                            <Button 
                                variant="outline"
                                className="w-full h-12"
                                asChild
                            >
                                <Link href="/cleaner/jobs">
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                    View All Jobs
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Note Modal */}
            {showNoteModal && (
                <NoteModal 
                    bookingId={bookingId}
                    clientId={customer.id}
                    onClose={() => setShowNoteModal(false)} 
                />
            )}

            {/* Rating Modal */}
            {showRatingModal && (
                <ClientRatingModal 
                    bookingId={bookingId}
                    clientName={`${customer.firstName} ${customer.lastName}`}
                    onClose={() => setShowRatingModal(false)} 
                />
            )}
        </div>
    );
}

// Photo Upload Section Component
function PhotoUploadSection({ 
    bookingId, 
    type, 
    photos, 
    required, 
    disabled,
    onUpload 
}: {
    bookingId: string;
    type: 'BEFORE' | 'AFTER';
    photos: Photo[];
    required: number;
    disabled: boolean;
    onUpload: () => void;
}) {
    const [uploading, setUploading] = useState(false);
    const rooms = ['Kitchen', 'Living Room', 'Bathroom', 'Bedroom', 'Other'];

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        
        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'job-photos');
                formData.append('bookingId', bookingId);
                formData.append('photoType', type);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Upload failed');
                toast.success('Photo uploaded!');
            } catch (err) {
                toast.error('Failed to upload photo');
            }
        }

        setUploading(false);
        onUpload();
        e.target.value = ''; // Reset input
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">{type === 'BEFORE' ? 'Before' : 'After'} Photos</h3>
                    <p className="text-sm text-gray-500">
                        {photos.length}/{required} photos taken
                    </p>
                </div>
                <label className={`${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={handlePhotoUpload}
                        disabled={disabled || uploading}
                        className="hidden"
                    />
                    <Button variant="outline" disabled={disabled || uploading} asChild>
                        <span>
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Camera className="w-4 h-4 mr-2" />
                            )}
                            Take Photo
                        </span>
                    </Button>
                </label>
            </div>

            {photos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">
                        {disabled 
                            ? type === 'BEFORE' 
                                ? 'Check in first to take photos'
                                : 'Start the job to take after photos'
                            : `Take at least ${required} ${type.toLowerCase()} photos`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map(photo => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                            <img 
                                src={photo.url} 
                                alt={`${type} photo`}
                                className="w-full h-full object-cover"
                            />
                            {photo.room && (
                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                    {photo.room}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Note Modal Component
function NoteModal({ 
    bookingId, 
    clientId, 
    onClose 
}: { 
    bookingId: string;
    clientId: string;
    onClose: () => void;
}) {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [showOnNextJob, setShowOnNextJob] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error('Please enter a note');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/cleaner/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    content: content.trim(),
                    showOnNextJob,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Note saved!');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <StickyNote className="w-5 h-5" />
                        Add Private Note
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                
                <p className="text-sm text-gray-500">
                    Add a private note about this client or location. Only you can see this.
                </p>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="e.g., Key is under the mat, has a dog named Max, prefer specific cleaning products..."
                    className="w-full h-32 p-3 border rounded-lg resize-none"
                    maxLength={2000}
                />

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={showOnNextJob}
                        onChange={(e) => setShowOnNextJob(e.target.checked)}
                        className="rounded"
                    />
                    <span>Show as reminder on next job with this client</span>
                </label>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Note
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Client Rating Modal Component
function ClientRatingModal({ 
    bookingId, 
    clientName,
    onClose 
}: { 
    bookingId: string;
    clientName: string;
    onClose: () => void;
}) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/cleaner/client-rating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    rating,
                    comment: comment.trim() || undefined,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Rating submitted!');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit rating');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Rate {clientName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                
                <p className="text-sm text-gray-500">
                    This rating is private and helps you remember clients for future jobs.
                </p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1"
                        >
                            <Star 
                                className={`w-10 h-10 transition-colors ${
                                    star <= rating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                }`} 
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional comment..."
                    className="w-full h-24 p-3 border rounded-lg resize-none"
                    maxLength={500}
                />

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Skip
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Rating
                    </Button>
                </div>
            </div>
        </div>
    );
}
