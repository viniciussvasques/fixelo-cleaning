'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    Users, 
    Star, 
    Ban, 
    StickyNote, 
    Loader2,
    ChevronRight,
    Trash2,
    Plus,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ClientRating {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

interface BlacklistEntry {
    id: string;
    reason: string | null;
    createdAt: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface Note {
    id: string;
    title: string | null;
    content: string;
    tags: string | null;
    showOnNextJob: boolean;
    createdAt: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    address: {
        id: string;
        street: string;
        city: string;
        label: string | null;
    } | null;
}

export default function CleanerClientsPage() {
    const [activeTab, setActiveTab] = useState('ratings');
    const [ratings, setRatings] = useState<ClientRating[]>([]);
    const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ratingsRes, blacklistRes, notesRes] = await Promise.all([
                fetch('/api/cleaner/client-rating'),
                fetch('/api/cleaner/blacklist'),
                fetch('/api/cleaner/notes')
            ]);

            if (ratingsRes.ok) setRatings(await ratingsRes.json());
            if (blacklistRes.ok) setBlacklist(await blacklistRes.json());
            if (notesRes.ok) setNotes(await notesRes.json());
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromBlacklist = async (clientId: string) => {
        try {
            const res = await fetch(`/api/cleaner/blacklist?clientId=${clientId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove');
            toast.success('Client removed from blacklist');
            setBlacklist(prev => prev.filter(b => b.client.id !== clientId));
        } catch (err) {
            toast.error('Failed to remove from blacklist');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const res = await fetch(`/api/cleaner/notes?id=${noteId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Note deleted');
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            toast.error('Failed to delete note');
        }
    };

    const filteredRatings = ratings.filter(r => 
        `${r.client.firstName} ${r.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBlacklist = blacklist.filter(b => 
        `${b.client.firstName} ${b.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredNotes = notes.filter(n => 
        (n.client && `${n.client.firstName} ${n.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.address && n.address.street.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Clients</h1>
                    <p className="text-gray-500">Manage your client relationships</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search clients, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ratings">
                        <Star className="w-4 h-4 mr-1" />
                        Ratings ({ratings.length})
                    </TabsTrigger>
                    <TabsTrigger value="blacklist">
                        <Ban className="w-4 h-4 mr-1" />
                        Blacklist ({blacklist.length})
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                        <StickyNote className="w-4 h-4 mr-1" />
                        Notes ({notes.length})
                    </TabsTrigger>
                </TabsList>

                {/* Ratings Tab */}
                <TabsContent value="ratings" className="space-y-4">
                    {filteredRatings.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Star className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">No client ratings yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRatings.map(rating => (
                            <Card key={rating.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium">
                                                {rating.client.firstName} {rating.client.lastName}
                                            </h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${
                                                            star <= rating.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            {rating.comment && (
                                                <p className="text-sm text-gray-600 mt-2">{rating.comment}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(rating.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Blacklist Tab */}
                <TabsContent value="blacklist" className="space-y-4">
                    {filteredBlacklist.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Ban className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">No clients blacklisted</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Blacklisted clients won't be matched with you for jobs
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBlacklist.map(entry => (
                            <Card key={entry.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">
                                                {entry.client.firstName} {entry.client.lastName}
                                            </h3>
                                            {entry.reason && (
                                                <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                Added {new Date(entry.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveFromBlacklist(entry.client.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                    {filteredNotes.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <StickyNote className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">No notes yet</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Add notes during jobs to remember important details
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotes.map(note => (
                            <Card key={note.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {note.client && (
                                                    <Badge variant="outline">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {note.client.firstName} {note.client.lastName}
                                                    </Badge>
                                                )}
                                                {note.address && (
                                                    <Badge variant="outline">
                                                        {note.address.label || note.address.street}
                                                    </Badge>
                                                )}
                                                {note.showOnNextJob && (
                                                    <Badge className="bg-yellow-100 text-yellow-700">
                                                        Reminder
                                                    </Badge>
                                                )}
                                            </div>
                                            {note.title && (
                                                <h3 className="font-medium">{note.title}</h3>
                                            )}
                                            <p className="text-sm text-gray-600 mt-1">{note.content}</p>
                                            <span className="text-xs text-gray-400">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteNote(note.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
