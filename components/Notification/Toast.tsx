import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    onClose: (id: string) => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 5000 }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(100);
    const startTimeRef = useRef<number>(Date.now());
    const remainingTimeRef = useRef<number>(duration);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    }, [id, onClose]);

    useEffect(() => {
        if (duration <= 0) return;

        let animationFrame: number;

        const animate = () => {
            if (isPaused) return;

            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, remainingTimeRef.current - elapsed);
            const newProgress = (remaining / duration) * 100;

            setProgress(newProgress);

            if (remaining <= 0) {
                handleClose();
            } else {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isPaused, duration, handleClose]);

    const handleMouseEnter = () => {
        setIsPaused(true);
        remainingTimeRef.current = (progress / 100) * duration;
    };

    const handleMouseLeave = () => {
        startTimeRef.current = Date.now();
        setIsPaused(false);
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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
            {duration > 0 && (
                <div
                    className="toast-progress"
                    style={{
                        width: `${progress}%`,
                        transition: isPaused ? 'none' : 'width 100ms linear'
                    }}
                />
            )}
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
