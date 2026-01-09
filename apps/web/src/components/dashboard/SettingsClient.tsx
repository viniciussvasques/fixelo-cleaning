'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Shield, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function SettingsClient() {
    const _router = useRouter();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        // Load preferences
        fetch('/api/user/preferences')
            .then(res => res.json())
            .then(data => setPreferences(data))
            .catch(console.error);
    }, []);

    const handlePreferenceChange = async (key: string, value: boolean) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        setIsSaving(true);

        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...preferences, [key]: value }),
            });

            if (!response.ok) {
                throw new Error('Failed to save preference');
            }
        } catch (error) {
            console.error('Failed to save preference:', error);
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !value }));
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        setIsChangingPassword(true);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (error) {
            setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive booking confirmations and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                                className="sr-only peer"
                                disabled={isSaving}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Get text reminders before appointments</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.smsNotifications}
                                onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                                className="sr-only peer"
                                disabled={isSaving}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Marketing Emails</p>
                            <p className="text-sm text-gray-500">Receive special offers and promotions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.marketingEmails}
                                onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                                className="sr-only peer"
                                disabled={isSaving}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy & Security
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-gray-600" />
                            <div>
                                <p className="font-medium text-gray-900">Change Password</p>
                                <p className="text-sm text-gray-500 mt-1">Update your account password</p>
                            </div>
                        </div>
                    </button>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500 mt-1">Coming soon - Add an extra layer of security</p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <p className="font-medium text-gray-900">Download My Data</p>
                        <p className="text-sm text-gray-500 mt-1">Coming soon - Get a copy of your personal information</p>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow border-2 border-red-200">
                <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                    <h2 className="text-xl font-semibold text-red-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Danger Zone
                    </h2>
                </div>
                <div className="p-6">
                    <button
                        onClick={() => alert('Account deletion requires contacting support')}
                        className="w-full p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors text-left"
                    >
                        <p className="font-medium text-red-900">Delete Account</p>
                        <p className="text-sm text-red-700 mt-1">Permanently delete your account and all data</p>
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>

                        {passwordSuccess && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-green-800">Password changed successfully!</p>
                            </div>
                        )}

                        {passwordError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-red-800">{passwordError}</p>
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    minLength={8}
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        setPasswordError('');
                                    }}
                                    disabled={isChangingPassword}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
