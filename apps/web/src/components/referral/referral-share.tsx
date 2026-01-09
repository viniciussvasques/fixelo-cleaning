'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Copy, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralShare() {
    const { data: session } = useSession();
    const [_copied, setCopied] = useState(false);

    if (!session?.user?.referralCode) return null;

    const referralLink = `${window.location.origin}/book?ref=${session.user.referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Fixelo',
                    text: 'Get $20 off your first home cleaning with my referral code!',
                    url: referralLink,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Give $20, Get $20</h3>
                        <p className="text-indigo-100 text-sm">Friends get $20 off their first clean</p>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-2">Your Referral Code</p>
                    <div className="flex items-center justify-between gap-4">
                        <code className="text-2xl font-mono font-bold tracking-wider">{session.user.referralCode}</code>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Copy Code"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Share Link"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-sm text-indigo-100 leading-relaxed">
                    Share this link with your friends. You'll earn <strong>$20 credit</strong> when they complete their first booking.
                </p>
            </div>
        </div>
    );
}
