
import React, { useState, useEffect } from 'react';
import { User, Correspondence } from '../types';
import { correspondenceService, exportToCSV } from '../services/supabase';

interface UserHistoryModalProps {
    user: User;
    onClose: () => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({ user, onClose }) => {
    const [history, setHistory] = useState<Correspondence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const data = await correspondenceService.getUserHistory(user.id, user.email);
            setHistory(data);
            setLoading(false);
        };
        fetchHistory();
    }, [user]);

    const handleExport = () => {
        const exportData = history.map(item => ({
            Fecha: item.date,
            Hora: item.time,
            Remitente: item.sender,
            Tipo: item.type,
            Estado: item.status,
            Entregado_Por: item.delivered_by_name || 'N/A',
            Referencia: item.tracking_number || '',
            Notas: item.internal_operational_notes || ''
        }));
        exportToCSV(exportData, `Historial_${user.name.replace(/ /g, '_')}`);
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-neu-bg-light dark:bg-neu-bg-dark md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 md:px-10 py-6 md:py-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-theme shrink-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight leading-none">Historial de Usuario</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{user.role}</span>
                            <span className="size-1 bg-gray-300 rounded-full"></span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[200px]">
                                {user.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            disabled={loading || history.length === 0}
                            className="hidden md:flex items-center gap-2 px-6 h-12 rounded-full neu-btn text-[10px] font-black uppercase tracking-widest text-primary hover:scale-105 transition-all disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Exportar CSV
                        </button>
                        <button
                            onClick={onClose}
                            className="size-10 md:size-12 flex items-center justify-center rounded-full neu-btn text-gray-400 hover:text-primary transition-all active:scale-90"
                        >
                            <span className="material-symbols-outlined font-black">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-gray-50/30 dark:bg-black/5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando historial...</span>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="space-y-4">
                            {/* Mobile Header for CSV on small screens */}
                            <button
                                onClick={handleExport}
                                className="md:hidden w-full flex items-center justify-center gap-2 h-14 rounded-3xl neu-btn text-[10px] font-black uppercase tracking-widest text-primary mb-6"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Exportar CSV
                            </button>

                            <div className="overflow-x-auto pb-4">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-6">
                                            <th className="px-6 pb-2">Fecha/Hora</th>
                                            <th className="pb-2">Acción / Registro</th>
                                            <th className="pb-2">Estado</th>
                                            <th className="px-6 pb-2 text-right">Información</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((record) => (
                                            <tr key={record.id} className="neu-surface group transition-all duration-300 hover:bg-white/40 dark:hover:bg-black/20">
                                                <td className="py-5 px-6 rounded-l-[25px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-gray-700 dark:text-gray-200">{record.date}</span>
                                                        <span className="text-[9px] font-bold text-gray-400">{record.time}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-xl">
                                                                {record.type === 'Paquete' ? 'package_2' : record.type === 'Carta' ? 'mail' : 'verified'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-gray-700 dark:text-gray-200">{record.sender}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{record.type}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${record.status === 'Entregado' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                                            record.status === 'Recibido' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
                                                                'text-amber-500 border-amber-500/20 bg-amber-500/5'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 rounded-r-[25px] text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase">
                                                            {record.status === 'Entregado' ? `Por: ${record.delivered_by_name || 'Sistema'}` : `Ref: ${record.tracking_number || '-'}`}
                                                        </span>
                                                        {record.price && (
                                                            <span className="text-[9px] font-bold text-primary mt-0.5">{record.price} €</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center neu-inset rounded-[40px] flex flex-col items-center gap-4 transition-theme">
                            <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700">history</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sin actividad registrada</p>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic italic">No hay registros vinculados a este usuario</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 md:px-10 py-6 md:py-8 text-right bg-white dark:bg-black/40 border-t border-gray-100 dark:border-gray-800 transition-theme shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto neu-btn px-12 py-4 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-primary transition-all active:scale-95"
                    >
                        Cerrar Historial
                    </button>
                </div>
            </div>
        </div>
    );
};
