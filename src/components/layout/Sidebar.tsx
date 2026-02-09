'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { getConversations, getConversationMessages, Conversation, Message } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onNewChat: () => void;
    user: User | null;
    conversationId: string | null;
    onSelectConversation: (id: string, messages: Message[]) => void;
    refreshTrigger?: number;
}

function groupConversationsByDate(conversations: Conversation[]) {
    const groups: { [key: string]: Conversation[] } = {
        'Hari Ini': [],
        'Kemarin': [],
        '7 Hari Terakhir': [],
        '30 Hari Terakhir': [],
        'Lebih Lama': []
    };

    conversations.forEach(conv => {
        const date = new Date(conv.lastUpdated || Date.now());
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (date.toDateString() === now.toDateString()) {
            groups['Hari Ini'].push(conv);
        } else if (diffDays === 1) {
            groups['Kemarin'].push(conv);
        } else if (diffDays <= 7) {
            groups['7 Hari Terakhir'].push(conv);
        } else if (diffDays <= 30) {
            groups['30 Hari Terakhir'].push(conv);
        } else {
            groups['Lebih Lama'].push(conv);
        }
    });

    return groups;
}

export default function Sidebar({
    isOpen,
    onToggle,
    onNewChat,
    user,
    conversationId,
    onSelectConversation,
    refreshTrigger = 0,
}: SidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState<{ nextCursor: string | null, hasMore: boolean }>({ nextCursor: null, hasMore: false });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadConversations();
        }
    }, [user, refreshTrigger]);

    const loadConversations = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { conversations: data, pagination: pag } = await getConversations(user.uid);
            setConversations(data);
            setPagination(pag);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const observerTarget = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);

    const handleLoadMore = useCallback(async () => {
        if (!user || !pagination.nextCursor || isLoadingRef.current) return;

        isLoadingRef.current = true;
        setLoadingMore(true);

        try {
            const { conversations: newConvs, pagination: newPag } = await getConversations(user.uid, 20, pagination.nextCursor);

            setConversations(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNewConvs = newConvs.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNewConvs];
            });

            setPagination(newPag);
        } catch (error) {
            console.error('Error loading more conversations:', error);
        } finally {
            setLoadingMore(false);
            // Small delay to prevent rapid-fire loops if content size didn't change
            setTimeout(() => {
                isLoadingRef.current = false;
            }, 500);
        }
    }, [user, pagination.nextCursor]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && pagination.hasMore && !isLoadingRef.current) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [pagination.hasMore, handleLoadMore]);

    const handleSelectConversation = async (conv: Conversation) => {
        if (!user) return;
        try {
            const messages = await getConversationMessages(user.uid, conv.id);
            onSelectConversation(conv.id, messages);
            // Auto close sidebar on mobile after selection
            if (window.innerWidth < 1024) {
                onToggle();
            }
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
          bg-[var(--sidebar-bg)] border-r border-[var(--border)]
          flex flex-col
          transform transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0 w-[280px]' : 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-[80px] lg:overflow-visible'}
        `}
            >
                {/* Header */}
                <div className={`p-4 ${isOpen ? 'space-y-4' : 'flex flex-col items-center gap-4'}`}>
                    {/* Branding & Toggle */}
                    <div className={`flex items-center ${isOpen ? 'justify-between px-2' : 'justify-center w-full'}`}>
                        {isOpen && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 relative">
                                    <Image
                                        src="/Aksara-AI-Logo-Warna.png"
                                        alt="Aksara AI Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="font-bold text-lg font-jakarta tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                                    Aksara AI
                                </span>
                            </div>
                        )}

                        {/* Desktop Toggle Button (Internal) */}
                        <button
                            onClick={onToggle}
                            className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors hidden lg:block ${!isOpen && 'mb-2'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* New Chat Button */}
                    {user && (
                        <button
                            onClick={() => {
                                onNewChat();
                                if (window.innerWidth < 1024) onToggle();
                            }}
                            className={`
                                flex items-center gap-3 transition-all duration-300 group
                                ${isOpen
                                    ? 'w-full px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/10'
                                    : 'w-12 h-12 justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md'
                                }
                            `}
                            title={!isOpen ? "Buat Chat Baru" : undefined}
                        >
                            <div className={`${isOpen ? 'p-0.5 bg-white/20 rounded' : ''}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            {isOpen && <span className="font-semibold text-sm whitespace-nowrap">Buat Chat Baru</span>}
                        </button>
                    )}

                    {/* Search Bar */}
                    {isOpen && (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {isOpen && (
                        !user ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 dark:text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-200">Riwayat Tersimpan</p>
                                <p className="text-xs opacity-70 mb-4">Masuk untuk melihat obrolan lama</p>
                                <Link
                                    href="/login"
                                    className="px-5 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                    Masuk Akun
                                </Link>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-500">Memuat...</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {Object.entries(groupConversationsByDate(conversations.filter(c =>
                                    c.title.toLowerCase().includes(searchQuery.toLowerCase())
                                ))).map(([group, groupConvs]) => (
                                    groupConvs.length > 0 && (
                                        <div key={group} className="mb-4">
                                            <h3 className="px-3 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 bg-[var(--sidebar-bg)] z-10 transition-colors">
                                                {group}
                                            </h3>
                                            {groupConvs.map((conv) => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => handleSelectConversation(conv)}
                                                    className={`
                                                        w-full text-left rounded-lg text-sm transition-all group relative overflow-hidden flex items-center gap-3 mb-1 px-3 py-2.5
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
                                                    <span className="truncate pr-4 flex-1 text-left">{conv.title}</span>
                                                    {conversationId === conv.id && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ))}

                                {/* Infinite Scroll Target */}
                                <div ref={observerTarget} className="h-4 w-full" />

                                {loadingMore && (
                                    <div className="py-2 text-center">
                                        <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0b1120]">
                    {user ? (
                        <Link
                            href="/profile"
                            className={`flex items-center gap-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${isOpen ? 'p-3' : 'justify-center p-2'}`}
                            title={!isOpen ? "Pengaturan Akun" : undefined}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shadow-sm flex-shrink-0">
                                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {isOpen && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {user.displayName || user.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-blue-500 transition-colors">
                                            Pengaturan Akun
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </>
                            )}
                        </Link>
                    ) : (
                        <div className={`flex gap-2 ${!isOpen && 'flex-col'}`}>
                            <Link
                                href="/login"
                                className={`flex-1 text-center rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${isOpen ? 'py-2.5' : 'py-2 text-xs'}`}
                            >
                                {isOpen ? 'Masuk' : 'Login'}
                            </Link>
                            <Link
                                href="/register"
                                className={`flex-1 text-center rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 ${isOpen ? 'py-2.5' : 'py-2 text-xs'}`}
                            >
                                {isOpen ? 'Daftar' : 'Join'}
                            </Link>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
}
