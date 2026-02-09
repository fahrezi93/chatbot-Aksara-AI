'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getConversations, getConversationMessages, Conversation, Message } from '@/lib/api';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onNewChat: () => void;
    user: User | null;
    conversationId: string | null;
    onSelectConversation: (id: string, messages: Message[]) => void;
}

export default function Sidebar({
    isOpen,
    onToggle,
    onNewChat,
    user,
    conversationId,
    onSelectConversation,
}: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user]);

    const loadConversations = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getConversations(user.uid);
            setConversations(data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectConversation = async (conv: Conversation) => {
        if (!user) return;
        try {
            const messages = await getConversationMessages(user.uid, conv.id);
            onSelectConversation(conv.id, messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onToggle}
            />

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[280px] bg-[var(--sidebar-bg)] border-r border-[var(--border)]
          flex flex-col
          transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0 lg:overflow-hidden'}
        `}
            >
                {/* Header */}
                <div className="p-4">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/10 transition-all hover:shadow-blue-600/20 active:scale-[0.98] group"
                    >
                        <div className="p-0.5 bg-white/20 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="font-semibold text-sm">Buat Chat Baru</span>
                    </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {!user ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 dark:text-gray-500">
                            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-200">Riwayat Tersimpan</p>
                            <p className="text-xs opacity-70 mb-4">Masuk untuk melihat obrolan lama</p>
                            <a
                                href="/login"
                                className="px-5 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-900 dark:text-white"
                            >
                                Masuk Akun
                            </a>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-500">Memuat...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
                            <p className="text-sm">Belum ada riwayat</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <h3 className="px-3 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Hari Ini
                            </h3>
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`
                    w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all group relative overflow-hidden flex items-center gap-3
                    ${conversationId === conv.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'}
                  `}
                                >
                                    <svg
                                        className={`w-4 h-4 flex-shrink-0 transition-colors ${conversationId === conv.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-600'
                                            }`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <span className="truncate pr-4">{conv.title}</span>
                                    {conversationId === conv.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0b1120]">
                    {user ? (
                        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user.displayName || user.email?.split('@')[0]}
                                </p>
                                <a href="/profile" className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                                    Pengaturan Akun
                                </a>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <a
                                href="/login"
                                className="flex-1 text-center py-2.5 rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Masuk
                            </a>
                            <a
                                href="/register"
                                className="flex-1 text-center py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                            >
                                Daftar
                            </a>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
}
