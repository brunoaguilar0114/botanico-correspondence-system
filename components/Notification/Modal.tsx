import React from 'react';

interface ModalProps {
    title: string;
    message: string;
    type?: 'info' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onClose
}) => {
    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onClose();
    };

    // Close on Escape key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${type}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="modal-header">
                    <h3 id="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    {onCancel && (
                        <button className="btn-secondary" onClick={handleCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button className={`btn-primary ${type === 'error' ? 'danger' : ''}`} onClick={handleConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
