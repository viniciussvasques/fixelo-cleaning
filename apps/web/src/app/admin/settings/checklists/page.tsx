'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    ClipboardList,
    Plus,
    Trash2,
    Edit,
    Loader2,
    CheckCircle,
    ArrowLeft,
    GripVertical,
} from 'lucide-react';
import Link from 'next/link';

interface ChecklistItem {
    id?: string;
    category: string;
    task: string;
    isRequired: boolean;
    sortOrder: number;
}

interface ChecklistTemplate {
    id: string;
    name: string;
    isDefault: boolean;
    serviceType?: { id: string; name: string } | null;
    items: ChecklistItem[];
    createdAt: string;
}

const DEFAULT_CATEGORIES = ['Kitchen', 'Bathroom', 'Living Areas & Bedrooms', 'General', 'Final Check'];

export default function ChecklistTemplatesPage() {
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formIsDefault, setFormIsDefault] = useState(false);
    const [formItems, setFormItems] = useState<ChecklistItem[]>([]);
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemTask, setNewItemTask] = useState('');
    const [newItemRequired, setNewItemRequired] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/checklist-templates');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const openNewDialog = () => {
        setEditingTemplate(null);
        setFormName('');
        setFormIsDefault(false);
        setFormItems([]);
        setShowDialog(true);
    };

    const openEditDialog = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
        setFormName(template.name);
        setFormIsDefault(template.isDefault);
        setFormItems(template.items.map(i => ({ ...i })));
        setShowDialog(true);
    };

    const addItem = () => {
        if (!newItemCategory || !newItemTask) {
            toast.error('Please fill category and task');
            return;
        }
        setFormItems([...formItems, {
            category: newItemCategory,
            task: newItemTask,
            isRequired: newItemRequired,
            sortOrder: formItems.length,
        }]);
        setNewItemTask('');
    };

    const removeItem = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formName || formItems.length === 0) {
            toast.error('Please provide name and at least one item');
            return;
        }

        setSubmitting(true);
        try {
            const method = editingTemplate ? 'PUT' : 'POST';
            const url = editingTemplate
                ? `/api/admin/checklist-templates/${editingTemplate.id}`
                : '/api/admin/checklist-templates';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    isDefault: formIsDefault,
                    items: formItems,
                }),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success(editingTemplate ? 'Template updated' : 'Template created');
            setShowDialog(false);
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await fetch(`/api/admin/checklist-templates/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    // Group items by category for display
    const groupItemsByCategory = (items: ChecklistItem[]) => {
        return items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, ChecklistItem[]>);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Checklist Templates</h1>
                        <p className="text-muted-foreground">Manage cleaning checklists for jobs</p>
                    </div>
                </div>
                <Button onClick={openNewDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className={template.isDefault ? 'border-primary' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-primary" />
                                        {template.name}
                                    </CardTitle>
                                </div>
                                {template.isDefault && (
                                    <Badge className="bg-primary text-white">Default</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Items:</span>
                                    <span className="font-medium">{template.items.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Required:</span>
                                    <span className="font-medium">{template.items.filter(i => i.isRequired).length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Categories:</span>
                                    <span className="font-medium">{Object.keys(groupItemsByCategory(template.items)).length}</span>
                                </div>

                                <div className="flex gap-2 pt-3 border-t">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(template)}>
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDelete(template.id)}
                                        disabled={template.isDefault}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-muted-foreground">No templates found</p>
                        <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                            Create your first template
                        </Button>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Checklist Template'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="space-y-2">
                            <Label>Template Name *</Label>
                            <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="e.g., Standard Cleaning"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isDefault"
                                checked={formIsDefault}
                                onCheckedChange={(checked) => setFormIsDefault(checked as boolean)}
                            />
                            <Label htmlFor="isDefault">Set as default template</Label>
                        </div>

                        {/* Add Item */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Add Checklist Item</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 flex-wrap">
                                    <select
                                        className="border rounded-md px-3 py-2 text-sm flex-1 min-w-[150px]"
                                        value={newItemCategory}
                                        onChange={(e) => setNewItemCategory(e.target.value)}
                                    >
                                        <option value="">Select Category</option>
                                        {DEFAULT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <Input
                                        placeholder="Task description"
                                        value={newItemTask}
                                        onChange={(e) => setNewItemTask(e.target.value)}
                                        className="flex-[2] min-w-[200px]"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="newRequired"
                                            checked={newItemRequired}
                                            onCheckedChange={(checked) => setNewItemRequired(checked as boolean)}
                                        />
                                        <Label htmlFor="newRequired" className="text-sm whitespace-nowrap">Required</Label>
                                    </div>
                                    <Button onClick={addItem} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items List */}
                        {formItems.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Checklist Items ({formItems.length})</h4>
                                {Object.entries(groupItemsByCategory(formItems)).map(([category, items]) => (
                                    <div key={category} className="border rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 font-medium text-sm">{category}</div>
                                        <div className="divide-y">
                                            {items.map((item, idx) => {
                                                const globalIdx = formItems.findIndex(i => i === item);
                                                return (
                                                    <div key={idx} className="flex items-center justify-between px-4 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <GripVertical className="w-4 h-4 text-gray-300" />
                                                            <span className="text-sm">{item.task}</span>
                                                            {item.isRequired && (
                                                                <Badge variant="outline" className="text-xs">Required</Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItem(globalIdx)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
