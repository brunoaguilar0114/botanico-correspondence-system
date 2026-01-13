import React, { useEffect, useState } from 'react';

interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // We don't need a timeout here because the context handles the removal
        // However, we could add a local "isExiting" state if we want to trigger
        // exit animations before the context removes it.
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300); // Wait for exit animation
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    return (
        <div
            className={`toast-item ${type} ${isExiting ? 'exit' : 'enter'}`}
            role="status"
            aria-live="polite"
        >
            <div className="toast-icon-wrapper">
                <span className="material-symbols-outlined toast-icon">{getIcon()}</span>
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close" onClick={handleClose} aria-label="Cerrar">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="toast-container">
            {children}
        </div>
    );
};
