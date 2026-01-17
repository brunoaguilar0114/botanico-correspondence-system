import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
}

interface ModalConfig {
    title: string;
    message: string;
    type?: 'info' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface NotificationContextType {
    showToast: (message: string, type?: NotificationType, duration?: number) => void;
    showModal: (config: ModalConfig) => void;
    hideModal: () => void;
    toasts: Notification[];
    removeToast: (id: string) => void;
    modal: ModalConfig | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Notification[]>([]);
    const [modal, setModal] = useState<ModalConfig | null>(null);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: NotificationType = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const showModal = useCallback((config: ModalConfig) => {
        setModal(config);
    }, []);

    const hideModal = useCallback(() => {
        setModal(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, showModal, hideModal, toasts, removeToast, modal }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
