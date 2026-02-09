'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';

interface ChatInputProps {
    onSend: (text: string, imageData?: string) => void;
    disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [imageData, setImageData] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (disabled) return;
        if (!message.trim() && !imageData) return;

        onSend(message, imageData || undefined);
        setMessage('');
        setImageData(null);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageData(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative">
            {/* Image Preview */}
            {imageData && (
                <div className="mb-3 relative inline-block animate-fade-in-up">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                        <img
                            src={imageData}
                            alt="Preview"
                            className="max-w-[200px] max-h-[150px] object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Input Container */}
            <div className="flex items-end gap-2 p-2 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-500/5 relative z-20 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                {/* Image Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 transition-all disabled:opacity-50"
                    title="Upload gambar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Tulis pesan..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 py-3.5 px-2 max-h-[200px] disabled:opacity-50 text-base"
                />

                {/* Send Button */}
                <button
                    onClick={handleSubmit}
                    disabled={disabled || (!message.trim() && !imageData)}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95"
                    title="Kirim"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
