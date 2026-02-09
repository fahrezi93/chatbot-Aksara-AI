'use client';

import { useState, useRef, useEffect } from 'react';

interface ModelSelectorProps {
    currentModel: 'gemini' | 'deepseek';
    onModelChange: (model: 'gemini' | 'deepseek') => void;
}

const models = [
    {
        id: 'gemini' as const,
        name: 'Gemini 2.5 Flash',
        description: 'Model untuk multitasking & percakapan umum',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4285f4" />
                        <stop offset="25%" stopColor="#ea4335" />
                        <stop offset="50%" stopColor="#fbbc04" />
                        <stop offset="75%" stopColor="#34a853" />
                        <stop offset="100%" stopColor="#4285f4" />
                    </linearGradient>
                </defs>
                <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    fill="url(#gemini-gradient)"
                />
            </svg>
        ),
    },
    {
        id: 'deepseek' as const,
        name: 'DeepSeek R1',
        description: 'Model untuk coding & tugas teknis',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                    d="M12 2C10.5 5 7 8 4 9C4 14 7 19 12 22C17 19 20 14 20 9C17 8 13.5 5 12 2Z"
                    fill="#3b82f6"
                />
                <circle cx="12" cy="12" r="2" fill="white" />
            </svg>
        ),
    },
];

export default function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentModelData = models.find((m) => m.id === currentModel) || models[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm group"
            >
                {currentModelData.icon}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                    {currentModelData.name}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden animate-scale-in origin-top-right">
                    <div className="p-2 space-y-1">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${currentModel === model.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-0.5 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {model.icon}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold ${currentModel === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                            {model.name}
                                        </span>
                                        {currentModel === model.id && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                        {model.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
