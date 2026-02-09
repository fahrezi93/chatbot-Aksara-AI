'use client';

import { Message } from '@/lib/api';

interface ChatMessageProps {
    message: Message;
    isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping }: ChatMessageProps) {
    if (isTyping) {
        return (
            <div className="flex gap-4 animate-fade-in px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xs">A</span>
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
                        <div className="px-5 py-3.5 rounded-3xl rounded-tr-sm bg-[var(--user-message-bg)] text-white shadow-lg shadow-blue-500/10">
                            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 animate-fade-in px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 flex items-center justify-center shadow-md mt-1">
                <span className="text-white font-bold text-xs">A</span>
            </div>
            <div className="flex-1 max-w-none min-w-0">
                <div className="inline-block px-6 py-4 rounded-[2rem] rounded-tl-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm w-full">
                    <div className="markdown-content text-gray-800 dark:text-gray-200 leading-relaxed">
                        {message.text}
                    </div>
                </div>
            </div>
        </div>
    );
}
