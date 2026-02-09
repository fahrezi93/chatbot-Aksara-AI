'use client';

import { useState, useRef, useEffect } from 'react';
import { AIModel } from '@/lib/api';

interface ModelSelectorProps {
    currentModel: AIModel;
    onModelChange: (model: AIModel) => void;
}

const models = [
    {
        id: 'gemini' as const,
        name: 'Gemini 2.5 Flash',
        description: 'Model Google terbaru & tercepat',
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
        description: 'Reasoning model via OpenRouter',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                    fill="#3b82f6"
                />
                <circle cx="12" cy="12" r="3" fill="#3b82f6" />
            </svg>
        ),
    },
    {
        id: 'claude' as const,
        name: 'Claude 3.5 Sonnet',
        description: 'Jago coding & nalar (Anthropic)',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#d97757" />
            </svg>
        ),
    },
    {
        id: 'llama' as const,
        name: 'Llama 3.1 405B',
        description: 'Open Source King (Meta)',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#0668E1" />
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white" />
            </svg>
        ),
    },
    {
        id: 'qwen' as const,
        name: 'Qwen 2.5 72B',
        description: 'Cepat & Cerdas (Alibaba)',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" fill="#615ced" />
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-sm transition-all shadow-sm group"
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
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl z-50 overflow-hidden animate-scale-in origin-top-right">
                    <div className="p-1.5 space-y-0.5">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model.id as AIModel);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all ${currentModel === model.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-0.5 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {model.icon}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold text-sm ${currentModel === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {model.name}
                                        </span>
                                        {currentModel === model.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm"></div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-1">
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
