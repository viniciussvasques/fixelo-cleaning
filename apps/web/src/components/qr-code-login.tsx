'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeLoginProps {
    title?: string;
    description?: string;
    onSuccess?: () => void;
}

export function QRCodeLogin({
    title = "Continue on Mobile",
    description = "Scan this QR code with your phone to continue",
    onSuccess
}: QRCodeLoginProps) {
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const generateQR = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/qr-session', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate QR');

            const data = await res.json();
            setQrUrl(data.qrUrl);
            setExpiresAt(new Date(data.expiresAt));
        } catch (e) {
            console.error('QR Generation error:', e);
            setError('Failed to generate QR code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateQR();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-lg">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-600">Generating QR code...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-red-200 shadow-lg">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={generateQR} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    const isExpired = timeLeft <= 0;

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>

            {/* QR Code */}
            <div className={`p-4 bg-white rounded-xl border-2 ${isExpired ? 'border-red-300 opacity-50' : 'border-slate-200'} relative`}>
                {qrUrl && (
                    <QRCodeSVG
                        value={qrUrl}
                        size={200}
                        level="H"
                        includeMargin
                        imageSettings={{
                            src: "/logo.png",
                            x: undefined,
                            y: undefined,
                            height: 40,
                            width: 40,
                            excavate: true
                        }}
                    />
                )}

                {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-600 font-medium">Expired</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 mt-4 text-sm">
                {isExpired ? (
                    <span className="text-red-600">QR code expired</span>
                ) : (
                    <>
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                            Expires in <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                        </span>
                    </>
                )}
            </div>

            {/* Refresh button */}
            <Button
                onClick={generateQR}
                variant="outline"
                size="sm"
                className="mt-4"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Code
            </Button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg w-full">
                <p className="text-sm font-medium text-slate-700 mb-2">How to use:</p>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Open your phone's camera app</li>
                    <li>Point at this QR code</li>
                    <li>Tap the notification to open</li>
                    <li>Continue your registration on mobile</li>
                </ol>
            </div>
        </div>
    );
}
