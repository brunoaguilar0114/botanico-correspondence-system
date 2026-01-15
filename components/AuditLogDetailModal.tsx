
import React from 'react';
import { Portal } from './Portal';

interface AuditLog {
  id: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  details: string;
  user_id: string;
  user_name: string;
  status: string;
  created_at: string;
}

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const getEventLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      'CREATE': 'Registro Creado',
      'UPDATE': 'Actualización',
      'DELETE': 'Eliminación',
      'NOTIFY': 'Notificación Enviada',
      'DELIVER': 'Entrega Realizada',
      'DIGITIZE': 'Documento Digitalizado',
      'STATUS_CHANGE': 'Cambio de Estado',
      'LOGIN': 'Inicio de Sesión'
    };
    return labels[eventType] || eventType;
  };

  const getResourceTypeLabel = (resourceType: string): string => {
    const labels: Record<string, string> = {
      'CORRESPONDENCE': 'Correspondencia',
      'USER': 'Usuario',
      'AUTH': 'Autenticación'
    };
    return labels[resourceType] || resourceType;
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass rounded-[40px] md:rounded-[50px] p-8 md:p-12 max-w-2xl w-full pointer-events-auto animate-in zoom-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl neu-btn flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">visibility</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 transition-theme">Detalles del Log</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Información completa del evento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-12 flex items-center justify-center rounded-full neu-btn text-gray-500 hover:text-red-500 transition-all hover:scale-110"
              title="Cerrar"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Evento y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="neu-inset p-5 rounded-[28px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipo de Evento</p>
                <p className="text-lg font-black text-gray-700 dark:text-gray-200 transition-theme">{getEventLabel(log.event_type)}</p>
              </div>
              <div className="neu-inset p-5 rounded-[28px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estado</p>
                <span className={`inline-block px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  log.status === 'Exitoso' ? 'bg-emerald-500/10 text-emerald-600' :
                  log.status === 'Fallido' ? 'bg-red-500/10 text-red-500' :
                  'bg-primary/10 text-primary'
                }`}>
                  {log.status}
                </span>
              </div>
            </div>

            {/* Tipo de Recurso */}
            <div className="neu-inset p-5 rounded-[28px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipo de Recurso</p>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {getResourceTypeLabel(log.resource_type)}
                </span>
                {log.resource_id && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    ID: {log.resource_id}
                  </span>
                )}
              </div>
            </div>

            {/* Detalles */}
            <div className="neu-inset p-5 rounded-[28px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Detalles del Evento</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium transition-theme">
                {log.details}
              </p>
            </div>

            {/* Usuario */}
            <div className="neu-inset p-5 rounded-[28px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Usuario Responsable</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <div>
                  <p className="text-sm font-black text-primary uppercase tracking-widest">{log.user_name || 'Sistema'}</p>
                  {log.user_id && (
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {log.user_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fecha y Hora */}
            <div className="neu-inset p-5 rounded-[28px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fecha y Hora</p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">schedule</span>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 transition-theme">
                  {formatDate(log.created_at)}
                </p>
              </div>
            </div>

            {/* ID del Log */}
            <div className="neu-inset p-5 rounded-[28px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">ID del Registro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all transition-theme">{log.id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="w-full h-14 neu-btn rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all hover:scale-[1.02]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
