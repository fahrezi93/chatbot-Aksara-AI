'use client';

import { Message } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ChatMessageProps {
    message: Message;
    isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping }: ChatMessageProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        // Stop speaking when component unmounts
        return () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSpeaking]);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = 'id-ID';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    if (isTyping) {
        return (
            <div className="flex gap-4 animate-fade-in px-2">
                <div className="w-8 h-8 relative flex-shrink-0">
                    <Image
                        src="/Aksara-AI-Logo-Warna.png"
                        alt="Aksara AI"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="flex-1 max-w-none">
                    <div className="inline-block px-5 py-3 rounded-2xl rounded-tl-sm bg-[var(--surface-glass)] border border-white/20 shadow-sm backdrop-blur-sm">
                        <div className="typing-indicator flex items-center gap-1.5">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (message.isUser) {
        return (
            <div className="flex justify-end animate-fade-in-up px-2">
                <div className="max-w-[85%] sm:max-w-[75%]">
                    {message.imageData && (
                        <div className="mb-2 flex justify-end">
                            <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white/20">
                                <img
                                    src={message.imageData}
                                    alt="Uploaded"
                                    className="max-w-xs object-cover"
                                />
                            </div>
                        </div>
                    )}
                    {message.text && (
                        <div className="px-5 py-3.5 rounded-3xl rounded-tr-sm user-message-bubble shadow-lg shadow-blue-500/10">
                            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 animate-fade-in px-2 group">
            <div className="w-8 h-8 relative flex-shrink-0 mt-1">
                <Image
                    src="/Aksara-AI-Logo-Warna.png"
                    alt="Aksara AI"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex-1 max-w-none min-w-0">
                <div className="inline-block px-6 py-4 rounded-[2rem] rounded-tl-sm ai-message-bubble shadow-sm w-full relative">
                    <div className="markdown-content text-[var(--text-primary)] leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                        </ReactMarkdown>
                    </div>

                    {/* TTS Button - Visible on hover or when speaking */}
                    <div className={`absolute -bottom-8 left-0 flex gap-2 transition-opacity duration-200 ${isSpeaking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handleSpeak}
                            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isSpeaking ? 'text-blue-500' : 'text-gray-400'}`}
                            title={isSpeaking ? "Stop bicara" : "Bacakan"}
                        >
                            {isSpeaking ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
