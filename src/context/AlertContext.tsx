'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import CustomAlert from '@/components/ui/CustomAlert';

type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alert, setAlert] = useState<AlertOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const showAlert = useCallback((options: AlertOptions) => {
        setAlert(options);
        setIsOpen(true);
    }, []);

    const hideAlert = useCallback(() => {
        setIsOpen(false);
        // Small timeout to allow animation to complete before clearing state
        setTimeout(() => setAlert(null), 300);
    }, []);

    const handleConfirm = () => {
        if (alert?.onConfirm) alert.onConfirm();
        hideAlert();
    };

    const handleCancel = () => {
        if (alert?.onCancel) alert.onCancel();
        hideAlert();
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert && (
                <CustomAlert
                    isOpen={isOpen}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    confirmText={alert.confirmText}
                    cancelText={alert.cancelText}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
