'use client';

import { useState, useEffect } from 'react';
import { updateProfile, signOut, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import SystemPromptPanel from '@/components/chat/SystemPromptPanel';
import { getUserPreferences, updateUserPreferences } from '@/lib/api';

export default function ProfilePage() {
    const { user, loading } = useAuthState();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            setName(user.displayName || '');

            // Load preferences
            setIsPromptLoading(true);
            getUserPreferences(user.uid).then(prefs => {
                if (prefs?.systemPrompt) {
                    setSystemPrompt(prefs.systemPrompt);
                }
            }).finally(() => {
                setIsPromptLoading(false);
            });
        }
    }, [user, loading, router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateProfile(user, { displayName: name });
            setSuccess('Profil berhasil diperbarui');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Gagal memperbarui profil');
        } finally {
            setSaving(false);
        }
    };

    const handleSystemPromptChange = async (prompt: string) => {
        setSystemPrompt(prompt);
        if (user) {
            await updateUserPreferences(user.uid, { systemPrompt: prompt });
            setSuccess('Instruksi khusus berhasil disimpan');
            setTimeout(() => setSuccess(''), 3000);
        }
    };


    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/');
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        try {
            await deleteUser(user);
            router.push('/');
        } catch {
            setError('Gagal menghapus akun. Silakan login ulang dan coba lagi.');
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header & Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kelola preferensi akun Anda</p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {success && (
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-3 animate-fade-in">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {success}
                    </div>
                )}
                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-3 animate-fade-in">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Section 1: Profile Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profil Saya
                        </h2>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
                                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Lengkap
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Section 2: Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Personalisasi
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Tema Aplikasi</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sesuaikan tampilan antarmuka</p>
                                </div>
                                <ThemeToggle />
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                                <div className="mb-3">
                                    <p className="font-medium text-gray-900 dark:text-white">Instruksi Khusus AI</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Atur instruksi dasar untuk setiap obrolan dengan AI</p>
                                </div>
                                <SystemPromptPanel
                                    systemPrompt={systemPrompt}
                                    onSystemPromptChange={handleSystemPromptChange}
                                    disabled={isPromptLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Account Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Keamanan Akun
                        </h2>

                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 border border-gray-100 dark:border-gray-700/50 transition-all text-gray-700 dark:text-gray-300 group"
                            >
                                <span className="font-medium">Keluar dari Akun</span>
                                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 transition-all text-red-600 dark:text-red-400 group"
                            >
                                <div>
                                    <span className="font-medium block text-left">Hapus Akun</span>
                                    <span className="text-xs opacity-70 block text-left">Tindakan ini tidak dapat dibatalkan</span>
                                </div>
                                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 max-w-sm w-full relative z-10 border border-white/10 shadow-2xl animate-scale-in">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto text-red-600 dark:text-red-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                            Hapus Akun Permanen?
                        </h3>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                            Semua data Anda akan dihapus dan tidak dapat dikembalikan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                                hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm text-gray-700 dark:text-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 
                                text-white transition-colors font-medium text-sm shadow-lg shadow-red-500/20"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
