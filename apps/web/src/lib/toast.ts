/**
 * Toast Notification Utility
 * 
 * Centralized toast functions using Sonner.
 * Toaster is already configured in layout.tsx.
 */

import { toast } from 'sonner';

export const showToast = {
    /**
     * Success notification
     */
    success: (message: string, description?: string) => {
        toast.success(message, { description });
    },

    /**
     * Error notification
     */
    error: (message: string, description?: string) => {
        toast.error(message, { description });
    },

    /**
     * Warning notification
     */
    warning: (message: string, description?: string) => {
        toast.warning(message, { description });
    },

    /**
     * Info notification
     */
    info: (message: string, description?: string) => {
        toast.info(message, { description });
    },

    /**
     * Loading notification - returns dismiss function
     */
    loading: (message: string) => {
        return toast.loading(message);
    },

    /**
     * Promise-based notification
     */
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages);
    },

    /**
     * Dismiss a specific toast or all toasts
     */
    dismiss: (toastId?: string | number) => {
        toast.dismiss(toastId);
    },
};

// Export individual functions for convenience
export const { success, error, warning, info, loading } = showToast;
