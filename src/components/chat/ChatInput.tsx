'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface ChatInputProps {
    onSend: (text: string, imageData?: string) => void;
    disabled?: boolean;
    value: string;
    onChange: (value: string) => void;
}

export default function ChatInput({ onSend, disabled, value, onChange }: ChatInputProps) {
    // const [message, setMessage] = useState(''); // Removed internal state
    const [imageData, setImageData] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialVoiceValueRef = useRef('');

    const [isMounted, setIsMounted] = useState(false);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (listening) {
            const currentInitial = initialVoiceValueRef.current;
            const separator = currentInitial && transcript ? ' ' : '';
            onChange(`${currentInitial}${separator}${transcript}`);
        }
    }, [transcript, listening]);

    // Auto-resize when value changes externally
    useEffect(() => {
        if (textareaRef.current) {
            resizeTextarea(textareaRef.current);
        }
    }, [value]);


    const handleSubmit = async () => {
        if (disabled || isParsing) return;
        if (!value.trim() && !imageData && !attachedFile) return;

        let finalMessage = value;

        // Parse document if attached
        if (attachedFile) {
            setIsParsing(true);
            try {
                const formData = new FormData();
                formData.append('file', attachedFile);

                const response = await fetch('/api/parse-document', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Failed to parse document');

                const data = await response.json();

                // Append parsed text to message
                const separator = finalMessage.trim() ? '\n\n' : '';
                finalMessage = `${finalMessage}${separator}--- Content of ${attachedFile.name} ---\n${data.text}\n-------------------`;

            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Gagal membaca dokumen. Silakan coba lagi.');
                setIsParsing(false);
                return;
            }
            setIsParsing(false);
        }

        onSend(finalMessage, imageData || undefined);
        onChange('');
        setImageData(null);
        setAttachedFile(null);
        resetTranscript();

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
        onChange(e.target.value);
        resizeTextarea(e.target);
    };

    const resizeTextarea = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 200) + 'px';
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageData(event.target?.result as string);
                setAttachedFile(null); // Clear non-image file if any
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf' || file.type === 'text/plain') {
            setAttachedFile(file);
            setImageData(null); // Clear image if any
        } else {
            alert('Hanya mendukung file Gambar, PDF, dan TXT.');
        }
    };

    const removeAttachment = () => {
        setImageData(null);
        setAttachedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleListening = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            initialVoiceValueRef.current = value; // Save current input value
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: 'id-ID' });
        }
    };

    return (
        <div className="relative">


            {/* Input Container */}
            <div className={`flex flex-col gap-2 p-2 rounded-[2rem] bg-white dark:bg-gray-800 border transition-all relative z-20 ${listening ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20'} shadow-xl shadow-blue-500/5`}>

                {/* Attachment Preview (Inside Container) */}
                {(imageData || attachedFile) && (
                    <div className="mx-2 mt-2 mb-1 relative inline-block self-start animate-fade-in-up">
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900/50">
                            {imageData ? (
                                <>
                                    <img
                                        src={imageData}
                                        alt="Preview"
                                        className="max-w-[200px] max-h-[150px] object-cover"
                                    />
                                </>
                            ) : (
                                <div className="flex items-center gap-3 p-3 min-w-[200px]">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                            {attachedFile?.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {(attachedFile?.size || 0 / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={removeAttachment}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-md z-10"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {isParsing && (
                            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-20">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end gap-2 w-full">
                    {/* File Upload Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isParsing}
                        className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 transition-all disabled:opacity-50"
                        title="Upload gambar atau dokumen (PDF/TXT)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf,text/plain"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || isParsing}
                        placeholder={listening ? "Mendengarkan..." : "Tulis pesan..."}
                        rows={1}
                        className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 py-3.5 px-2 max-h-[200px] disabled:opacity-50 text-base"
                    />

                    {/* Microphone Button */}
                    {isMounted && browserSupportsSpeechRecognition && (
                        <button
                            onClick={toggleListening}
                            disabled={disabled || isParsing}
                            className={`p-3 rounded-full transition-all ${listening
                                ? 'bg-red-500 text-white animate-pulse shadow-red-500/20'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400'
                                }`}
                            title={listening ? "Stop mendengarkan" : "Bicara"}
                        >
                            {listening ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    )}

                    {/* Send Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || isParsing || (!value.trim() && !imageData && !attachedFile)}
                        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95"
                        title="Kirim"
                    >
                        {isParsing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

