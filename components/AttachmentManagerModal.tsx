
import React, { useState, useRef } from 'react';
import { Correspondence, Attachment, PackageStatus } from '../types';
import { correspondenceService } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface AttachmentManagerModalProps {
    item: Correspondence;
    onClose: () => void;
    onRefresh: () => Promise<void>;
}

export const AttachmentManagerModal: React.FC<AttachmentManagerModalProps> = ({ item, onClose, onRefresh }) => {
    const { showToast, showModal } = useNotifications();
    const [isUploading, setIsUploading] = useState(false);
    const [loadingState, setLoadingState] = useState<string | null>(null); // To track which attachment is being processed
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return 'picture_as_pdf';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return 'image';
            case 'doc':
            case 'docx': return 'description';
            case 'xls':
            case 'xlsx': return 'table_chart';
            default: return 'attach_file';
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) {
            showToast('El archivo es demasiado grande (máx 10MB)', 'error');
            return;
        }

        setIsUploading(true);
        const { error } = await correspondenceService.uploadAttachment(item.id, file);

        if (error) {
            showToast('Error al subir archivo: ' + error, 'error');
        } else {
            // Also update status if it's the first attachment
            if (item.status !== PackageStatus.SCANNED && item.status !== PackageStatus.DELIVERED) {
                await correspondenceService.updateStatusWithTracking(item.id, {
                    status: PackageStatus.SCANNED,
                    digitized_at: new Date().toISOString()
                });
            }
            showToast('Archivo adjuntado correctamente', 'success');
            await onRefresh();
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (attachment: Attachment) => {
        showModal({
            title: 'Eliminar Adjunto',
            message: `¿Estás seguro de que deseas eliminar el archivo "${attachment.file_name}"?`,
            type: 'confirm',
            confirmText: 'Eliminar',
            onConfirm: async () => {
                setLoadingState(attachment.id);
                const { error } = await correspondenceService.deleteAttachment(attachment.id, attachment.file_path);
                if (error) {
                    showToast('Error al eliminar adjunto: ' + error, 'error');
                } else {
                    showToast('Archivo eliminado', 'warning');
                    await onRefresh();
                }
                setLoadingState(null);
            }
        });
    };

    const handleView = async (attachment: Attachment) => {
        setLoadingState(attachment.id);
        const url = await correspondenceService.getAttachmentUrl(attachment.file_path);
        setLoadingState(null);
        if (url) {
            window.open(url, '_blank');
        } else {
            showToast('No se pudo generar el enlace de descarga', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl bg-neu-bg-light dark:bg-neu-bg-dark md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-10"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="px-6 md:px-10 py-6 md:py-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-theme shrink-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight leading-none">Gestionar Archivos</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[250px]">
                            {item.recipient}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 md:size-12 flex items-center justify-center rounded-full neu-btn text-gray-400 hover:text-primary transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined font-black">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-gray-50/30 dark:bg-black/5">

                    {/* List of Attachments */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-4 md:mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                Archivos Actuales ({item.attachments?.length || 0})
                            </h3>
                        </div>

                        {item.attachments && item.attachments.length > 0 ? (
                            <div className="grid gap-3 md:gap-4">
                                {item.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className={`group relative overflow-hidden rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${loadingState === attachment.id
                                                ? 'opacity-60 grayscale'
                                                : 'neu-surface hover:bg-white/40 dark:hover:bg-black/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                            <div className="size-10 md:size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                                                <span className="material-symbols-outlined text-xl md:text-2xl font-black">
                                                    {loadingState === attachment.id ? 'sync' : getFileIcon(attachment.file_name)}
                                                </span>
                                                {loadingState === attachment.id && <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-2xl animate-spin"></div>}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate pr-2">
                                                    {attachment.file_name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        Subido el {new Date(attachment.created_at).toLocaleDateString()}
                                                    </span>
                                                    {attachment.file_size && (
                                                        <span className="size-1 bg-gray-300 rounded-full"></span>
                                                    )}
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        {(attachment.file_size ? (attachment.file_size / 1024 / 1024).toFixed(2) : '0')} MB
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleView(attachment)}
                                                disabled={!!loadingState}
                                                className="size-9 md:size-10 flex items-center justify-center rounded-full neu-btn text-blue-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
                                                title="Ver / Descargar"
                                            >
                                                <span className="material-symbols-outlined text-base font-black">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(attachment)}
                                                disabled={!!loadingState}
                                                className="size-9 md:size-10 flex items-center justify-center rounded-full neu-btn text-red-400 hover:scale-110 active:scale-95 transition-all shadow-sm"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-base font-black">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 md:py-24 text-center neu-inset rounded-[40px] flex flex-col items-center gap-4 transition-theme">
                                <div className="size-16 md:size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700">cloud_off</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sin archivos digitalizados</p>
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Sube un documento para comenzar</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Section */}
                    <div className="relative group">
                        <button
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full py-8 md:py-12 rounded-[40px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-4 group/drop ${isUploading
                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 text-primary hover:scale-[1.02] shadow-sm hover:shadow-primary/5'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleUpload}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            />
                            {isUploading ? (
                                <>
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">Subiendo archivo...</span>
                                        <span className="text-[9px] font-bold opacity-60">Por favor, espera un momento</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="size-14 md:size-16 rounded-3xl bg-primary/10 flex items-center justify-center transition-transform group-hover/drop:scale-110 group-hover/drop:rotate-3 duration-500">
                                        <span className="material-symbols-outlined text-3xl md:text-4xl font-black">add_circle</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.15em]">Adjuntar Nuevo Archivo</span>
                                        <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest px-6 text-center">
                                            PDF, JPG, PNG, DOCX, XLSX (Máximo 10MB)
                                        </span>
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 md:px-10 py-6 md:py-8 text-right bg-white dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 transition-theme shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto neu-btn px-12 py-4 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-primary transition-all active:scale-95"
                    >
                        Cerrar Panel
                    </button>
                </div>
            </div>
        </div>
    );
};
