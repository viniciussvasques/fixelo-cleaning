'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface PushNotificationPromptProps {
    onDismiss?: () => void;
}

export function PushNotificationPrompt({ onDismiss }: PushNotificationPromptProps) {
    const { data: session } = useSession();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if push is supported and user is logged in
        const checkPushSupport = async () => {
            if (!session?.user?.id) return;
            if (!('serviceWorker' in navigator)) return;
            if (!('PushManager' in window)) return;

            setIsSupported(true);

            // Check if already subscribed or dismissed
            const dismissed = localStorage.getItem('push-notification-dismissed');
            if (dismissed) return;

            // Check current permission state
            const permission = Notification.permission;
            if (permission === 'granted') {
                // Already have permission, register subscription
                await registerPushSubscription();
                return;
            }
            if (permission === 'denied') return;

            // Show prompt after delay (not immediately on page load)
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        };

        checkPushSupport();
    }, [session]);

    const registerPushSubscription = async () => {
        try {
            // Get VAPID public key
            const keyResponse = await fetch('/api/push/subscribe');
            if (!keyResponse.ok) return;

            const { publicKey } = await keyResponse.json();
            if (!publicKey) return;

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw-push.js');
            await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            console.log('Push notification subscription successful');
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
        }
    };

    const handleEnable = async () => {
        setIsSubscribing(true);
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                await registerPushSubscription();
            }

            setShowPrompt(false);
            localStorage.setItem('push-notification-dismissed', 'true');
        } catch (error) {
            console.error('Error enabling notifications:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('push-notification-dismissed', 'true');
        onDismiss?.();
    };

    if (!showPrompt || !isSupported) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900">Enable Notifications</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            Get instant updates about new jobs, bookings, and messages.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                onClick={handleEnable}
                                disabled={isSubscribing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubscribing ? 'Enabling...' : 'Enable'}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                            >
                                Not Now
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-slate-600 p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
