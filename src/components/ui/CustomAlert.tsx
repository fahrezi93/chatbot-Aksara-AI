'use client';

import React, { useEffect, useState } from 'react';

interface CustomAlertProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function CustomAlert({
    isOpen,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Batal',
    onConfirm,
    onCancel
}: CustomAlertProps) {
    const [isAnimate, setIsAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimate(true);
        } else {
            const timer = setTimeout(() => setIsAnimate(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimate) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'warning':
            case 'confirm':
                return (
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={type === 'confirm' ? undefined : onCancel}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 transform transition-all duration-300 border border-gray-100 dark:border-gray-800 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="flex flex-col items-center text-center">
                    {getIcon()}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-jakarta">
                        {title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex w-full gap-3">
                        {(type === 'confirm' || type === 'warning') && (
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 rounded-2xl font-semibold text-sm text-white shadow-lg transition-all active:scale-95 ${type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                                    type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' :
                                        type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                                            'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
