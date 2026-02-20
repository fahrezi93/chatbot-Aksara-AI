'use client';

import { useState, useRef, useEffect } from 'react';

interface SystemPromptPanelProps {
    systemPrompt: string;
    onSystemPromptChange: (prompt: string) => void;
    disabled?: boolean;
}

const PRESETS = [
    { label: '🧑‍🏫 Guru Matematika', prompt: 'Kamu adalah guru matematika yang hebat. Jelaskan konsep matematika dengan cara yang sederhana dan mudah dipahami. Gunakan contoh-contoh yang relevan.' },
    { label: '🇬🇧 English Only', prompt: 'You must respond in English only, regardless of what language the user writes in. Be clear and professional.' },
    { label: '💻 Code Expert', prompt: 'Kamu adalah senior software engineer. Berikan jawaban yang fokus pada kode, best practices, dan penjelasan teknis yang detail. Sertakan contoh kode.' },
    { label: '🌐 Penerjemah', prompt: 'Kamu adalah penerjemah profesional. Terjemahkan setiap teks yang diberikan ke Bahasa Indonesia. Jika teks sudah dalam Bahasa Indonesia, terjemahkan ke Bahasa Inggris.' },
    { label: '✍️ Penulis Kreatif', prompt: 'Kamu adalah penulis kreatif berbakat. Bantu user menulis cerita, puisi, atau konten kreatif lainnya dengan gaya bahasa yang indah dan menarik.' },
    { label: '📊 Data Analyst', prompt: 'You are a data analyst expert. Help analyze data, explain statistical concepts, suggest data visualizations, and write code for data processing using Python or SQL.' },
];

export default function SystemPromptPanel({ systemPrompt, onSystemPromptChange, disabled }: SystemPromptPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editValue, setEditValue] = useState(systemPrompt);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(systemPrompt);
    }, [systemPrompt]);

    useEffect(() => {
        if (isExpanded && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isExpanded]);

    const handleSave = () => {
        onSystemPromptChange(editValue.trim());
        setIsExpanded(false);
    };

    const handleClear = () => {
        setEditValue('');
        onSystemPromptChange('');
        setIsExpanded(false);
    };

    const handlePresetClick = (preset: string) => {
        setEditValue(preset);
        onSystemPromptChange(preset);
        setIsExpanded(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditValue(systemPrompt);
            setIsExpanded(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto w-full mb-2">
            {/* Compact bar */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    disabled={disabled}
                    className={`
                        w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all group
                        ${systemPrompt
                            ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-700/40 hover:border-purple-300 dark:hover:border-purple-600'
                            : 'bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <svg className={`w-4 h-4 flex-shrink-0 ${systemPrompt ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {systemPrompt ? (
                        <span className="text-sm text-purple-700 dark:text-purple-300 truncate flex-1">
                            <span className="font-medium">Instruksi:</span> {systemPrompt}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-1">
                            Tambah instruksi khusus untuk AI...
                        </span>
                    )}
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${systemPrompt ? 'text-purple-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            )}

            {/* Expanded panel */}
            {isExpanded && (
                <div className="bg-white dark:bg-gray-900 border border-purple-200/60 dark:border-purple-700/40 rounded-xl shadow-lg shadow-purple-500/5 overflow-hidden animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Instruksi Khusus</h3>
                        </div>
                        <button
                            onClick={() => { setEditValue(systemPrompt); setIsExpanded(false); }}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Textarea */}
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder='Contoh: "Kamu adalah guru matematika" atau "Jawab dalam bahasa Inggris"'
                            className="w-full h-24 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all placeholder:text-gray-400"
                        />

                        {/* Presets */}
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Preset cepat:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset.prompt)}
                                        className={`
                                            px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border
                                            ${editValue === preset.prompt
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600'
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-700'
                                            }
                                        `}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={handleClear}
                                disabled={!editValue && !systemPrompt}
                                className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Hapus Instruksi
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditValue(systemPrompt); setIsExpanded(false); }}
                                    className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-sm"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
