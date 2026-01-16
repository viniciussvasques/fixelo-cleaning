'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => onOpenChange(false)}
            />
            {/* Content container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                {children}
            </div>
        </div>
    );
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
    return (
        <div
            className={`relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-auto animate-fade-in ${className}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-sm text-muted-foreground mt-1 ${className || ''}`}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 ${className || ''}`}>{children}</div>;
}

export function DialogClose({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
            <X className="w-5 h-5 text-slate-500" />
        </button>
    );
}
