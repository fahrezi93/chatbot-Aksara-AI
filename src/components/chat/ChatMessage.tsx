'use client';

import { Message } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAlert } from '@/context/AlertContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
    message: Message;
    isTyping?: boolean;
    onEdit?: (newText: string) => void;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const content = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-mono text-sm" {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="my-6 rounded-xl overflow-hidden border border-white/5 shadow-2xl group/code bg-[#0B0E14]">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                    {language && (
                        <span className="text-[10px] font-medium text-white/30 lowercase font-mono tracking-wider">
                            {language}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 transition-all active:scale-95 group/copy"
                >
                    {copied ? (
                        <div className="flex items-center gap-1.2">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-[10px] font-medium text-emerald-400 lowercase">disalin</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-white/20 group-hover/copy:text-white/50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            <span className="text-[10px] font-medium lowercase">salin</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Syntax Highlighter */}
            <div className="relative">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1rem 0.75rem',
                        fontSize: '0.75rem',
                        lineHeight: '1.6',
                        background: 'transparent',
                        borderRadius: 0,
                    }}
                    codeTagProps={{
                        className: 'font-mono leading-relaxed'
                    }}
                >
                    {content}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default function ChatMessage({ message, isTyping, onEdit }: ChatMessageProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [voicesReady, setVoicesReady] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const { showAlert } = useAlert();

    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        // Check if voices are already loaded
        const checkVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setVoicesReady(true);
            }
        };

        checkVoices();

        // Listen for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
            checkVoices();
        };

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleSpeak = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check browser support
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            showAlert({
                title: 'Tidak Didukung',
                message: 'Browser Anda tidak mendukung fitur Text-to-Speech.',
                type: 'error'
            });
            return;
        }

        // Toggle off if already speaking
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Prepare text
        const textToSpeak = message.text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]+`/g, '')        // Remove inline code
            .replace(/[*_#~>]/g, '')         // Remove markdown symbols
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .trim();

        if (!textToSpeak) {
            console.warn('No text to speak');
            return;
        }

        // Cancel anything pending first
        window.speechSynthesis.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // Get voices and set Indonesian if available
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);

        // Try to find Indonesian voice
        let selectedVoice = voices.find(v => v.lang === 'id-ID');
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('id'));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'en-US'); // Fallback

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = 'id-ID';
        }

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Event handlers
        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            // "interrupted" is a normal state when we cancel() or start new speech
            if (event.error !== 'interrupted') {
                console.error('TTS Error:', event.error);
            }
            setIsSpeaking(false);
        };

        // Speak with a small delay to ensure everything is ready
        setIsSpeaking(true); // Immediate feedback
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(message.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSaveEdit = () => {
        if (editText.trim() && editText !== message.text && onEdit) {
            onEdit(editText);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(message.text);
        setIsEditing(false);
    };

    if (isTyping) {
        return (
            <div className="flex gap-4 animate-fade-in px-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 mt-1">
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
            <div className="flex justify-end animate-fade-in-up px-2 group">
                <div className="max-w-[85%] sm:max-w-[75%] relative">
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
                        <div className="flex items-center gap-2 justify-end">
                            {/* Actions to the left of user bubble */}
                            <div className={`flex items-center gap-1.5 transition-all duration-200 ${isEditing ? 'hidden' : copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                                    title="Edit pesan"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.243 3.757a2.828 2.828 0 114 4.000L11 18.343l-4 1 1-4 9.243-9.243z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`p-1 transition-colors ${copied ? 'text-green-500' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    title="Salin pesan"
                                >
                                    {copied ? (
                                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl rounded-tr-sm user-message-bubble shadow-lg shadow-blue-500/10">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[300px]">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="bg-transparent border-none outline-none resize-none text-white text-sm sm:text-base leading-relaxed w-full min-h-[60px]"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-3 py-1 rounded-full text-[10px] font-medium bg-white/10 hover:bg-white/20 transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-3 py-1 rounded-full text-[10px] font-medium bg-white text-black hover:bg-white/90 transition-colors"
                                            >
                                                Simpan & Kirim
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{message.text}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2 sm:gap-4 animate-fade-in px-2 group">
            <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 mt-1.5 sm:mt-1">
                <Image
                    src="/Aksara-AI-Logo-Warna.png"
                    alt="Aksara AI"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex-1 max-w-[95%] sm:max-w-none min-w-0">
                <div className="inline-block px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] rounded-tl-sm ai-message-bubble shadow-sm w-full relative">
                    <div className="markdown-content text-[var(--text-primary)] leading-relaxed text-sm sm:text-base">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code: CodeBlock,
                                a: ({ href, children, ...props }: any) => (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 hover:decoration-blue-500 transition-colors break-all"
                                        {...props}
                                    >
                                        {children}
                                    </a>
                                )
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                    </div>

                    {/* Action Buttons - Minimalist icons below bubble */}
                    <div className={`absolute -bottom-7 left-0 flex items-center gap-3 transition-opacity duration-200 ${isSpeaking || copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handleSpeak}
                            className={`p-1 hover:text-blue-500 transition-colors ${isSpeaking ? 'text-blue-500' : 'text-gray-400'}`}
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

                        <button
                            onClick={handleCopy}
                            className={`p-1 transition-colors ${copied ? 'text-green-500' : 'text-gray-400 hover:text-blue-500'}`}
                            title="Salin teks"
                        >
                            {copied ? (
                                <span className="text-[10px] font-medium">Disalin!</span>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
