'use client';

import { useState, useEffect } from 'react';
import { updateProfile, signOut, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/useAuthState';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, loading } = useAuthState();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            setName(user.displayName || '');
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
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />

            <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
                <div className="glass-panel rounded-3xl p-8 border border-white/20 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/"
                            className="p-2.5 rounded-xl bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-all border border-transparent hover:border-white/20 group"
                        >
                            <svg className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengaturan Profil</h1>
                    </div>

                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8 relative group">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center shadow-lg shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white font-bold text-4xl">
                                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <p className="mt-4 text-sm font-medium text-[var(--text-secondary)] bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                            {user.email}
                        </p>
                    </div>

                    {/* Messages */}
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 backdrop-blur-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">{success}</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 backdrop-blur-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] ml-1">
                                Nama Lengkap
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 
                                bg-white/50 dark:bg-black/20 text-[var(--text-primary)]
                                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
                                outline-none transition-all placeholder:text-gray-400 hover:bg-white/80 dark:hover:bg-black/40"
                                placeholder="Masukkan nama anda"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 
                                   hover:from-blue-700 hover:to-purple-700 text-white font-semibold
                                   shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all 
                                   disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan Perubahan</span>
                            )}
                        </button>
                    </form>

                    <div className="my-8 border-t border-gray-200/50 dark:border-gray-700/50" />

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50 
                           hover:bg-gray-50 dark:hover:bg-white/5 transition-all
                           text-[var(--text-primary)] font-medium text-sm flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-900/30
                           hover:bg-red-50 dark:hover:bg-red-900/20 transition-all
                           text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus Akun
                        </button>
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
                                <h3 className="text-xl font-bold text-center text-[var(--text-primary)] mb-2">
                                    Hapus Akun Permanen?
                                </h3>
                                <p className="text-center text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                                    Tindakan ini tidak dapat dibatalkan. Semua data dan riwayat obrolan akan dihapus secara permanen.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 
                                     hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
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
            </div>
        </div>
    );
}
