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
    const progressRef = useRef<HTMLDivElement>(null);
    const remainingTimeRef = useRef<number>(duration);
    const pausedAtRef = useRef<number>(0);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    }, [id, onClose]);

    // Manejar el cierre automático cuando la animación termina
    const handleAnimationEnd = useCallback(() => {
        if (!isPaused) {
            handleClose();
        }
    }, [isPaused, handleClose]);

    // Efecto para manejar pausa/reanudación
    useEffect(() => {
        if (duration <= 0) return;

        const progressEl = progressRef.current;
        if (!progressEl) return;

        if (isPaused) {
            // Guardar el tiempo restante cuando se pausa
            const computedStyle = window.getComputedStyle(progressEl);
            const currentWidth = parseFloat(computedStyle.width);
            const parentWidth = progressEl.parentElement?.offsetWidth || 1;
            const percentageRemaining = (currentWidth / parentWidth) * 100;
            remainingTimeRef.current = (percentageRemaining / 100) * duration;
            pausedAtRef.current = percentageRemaining;

            // Pausar la animación manteniendo el ancho actual
            progressEl.style.animationPlayState = 'paused';
        } else {
            // Reanudar la animación
            progressEl.style.animationPlayState = 'running';
        }
    }, [isPaused, duration]);

    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
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
                    ref={progressRef}
                    className="toast-progress"
                    style={{
                        animation: `progress-shrink ${duration}ms linear forwards`,
                        animationPlayState: isPaused ? 'paused' : 'running'
                    }}
                    onAnimationEnd={handleAnimationEnd}
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
