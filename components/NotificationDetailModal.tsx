
import React, { useState, useEffect } from 'react';
import { Portal } from './Portal';
import { Notification, Correspondence } from '../types';
import { supabase } from '../services/client';

interface NotificationDetailModalProps {
  notification: Notification | null;
  onClose: () => void;
  onNavigate: (correspondenceId: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  onNavigate
}) => {
  const [correspondence, setCorrespondence] = useState<Correspondence | null>(null);
  const [loading, setLoading] = useState(false);

  const getCorrespondenceId = (link?: string): string | null => {
    if (!link) return null;
    return link.includes('/') ? link.split('/').pop() || null : link;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  useEffect(() => {
    const fetchCorrespondence = async () => {
      if (!notification?.link) return;

      const correspondenceId = getCorrespondenceId(notification.link);
      if (!correspondenceId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('correspondence')
        .select('*, deliverer:profiles!delivered_by(full_name)')
        .eq('id', correspondenceId)
        .single();

      if (!error && data) {
        setCorrespondence({
          ...data,
          delivered_by_name: data.deliverer?.full_name
        } as Correspondence);
      }
      setLoading(false);
    };

    if (notification) {
      fetchCorrespondence();
    } else {
      setCorrespondence(null);
    }
  }, [notification]);

  if (!notification) return null;

  const handleNavigate = () => {
    const correspondenceId = getCorrespondenceId(notification.link);
    if (correspondenceId) {
      onNavigate(correspondenceId);
    }
    onClose();
  };

  const getTypeIcon = (type?: string): string => {
    switch (type) {
      case 'Paquete': return 'inventory_2';
      case 'Carta': return 'mail';
      case 'Certificado': return 'verified';
      default: return 'package_2';
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getNotificationIconColor = (type: string): string => {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-red-500';
      default: return 'text-primary';
    }
  };

  const getStatusStyle = (status?: string): string => {
    switch (status) {
      case 'Entregado': return 'bg-emerald-500/10 text-emerald-600';
      case 'Notificado': return 'bg-blue-500/10 text-blue-500';
      case 'Escaneado': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-primary/10 text-primary';
    }
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
          className="glass rounded-[40px] md:rounded-[50px] p-8 md:p-10 max-w-lg w-full pointer-events-auto animate-in zoom-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-2xl neu-btn flex items-center justify-center ${getNotificationIconColor(notification.type)}`}>
                <span className="material-symbols-outlined text-2xl">
                  {getNotificationIcon(notification.type)}
                </span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 transition-theme">
                  {notification.title}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                  {formatDate(notification.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center rounded-full neu-btn text-gray-500 hover:text-red-500 transition-all hover:scale-110"
              title="Cerrar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Mensaje de la Notificacion */}
          <div className="neu-inset p-5 rounded-[28px] mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Mensaje
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium transition-theme">
              {notification.message}
            </p>
          </div>

          {/* Detalles de Correspondencia (si existe link) */}
          {notification.link && (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">
                Correspondencia Asociada
              </p>

              {loading ? (
                <div className="neu-inset p-6 rounded-[28px] flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : correspondence ? (
                <>
                  {/* Remitente y Destinatario */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="neu-inset p-4 rounded-[20px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        De
                      </p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 transition-theme">
                        {correspondence.sender}
                      </p>
                    </div>
                    <div className="neu-inset p-4 rounded-[20px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Para
                      </p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 transition-theme">
                        {correspondence.recipient}
                      </p>
                    </div>
                  </div>

                  {/* Tipo y Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="neu-inset p-4 rounded-[20px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Tipo
                      </p>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">
                          {getTypeIcon(correspondence.type)}
                        </span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 transition-theme">
                          {correspondence.type}
                        </span>
                      </span>
                    </div>
                    <div className="neu-inset p-4 rounded-[20px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Estado
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusStyle(correspondence.status)}`}>
                        {correspondence.status}
                      </span>
                    </div>
                  </div>

                  {/* Fecha de recepcion */}
                  <div className="neu-inset p-4 rounded-[20px]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Recibido
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-gray-400">
                        schedule
                      </span>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300 transition-theme">
                        {correspondence.date} a las {correspondence.time}
                      </span>
                    </div>
                  </div>

                  {/* Tracking number si existe */}
                  {correspondence.tracking_number && (
                    <div className="neu-inset p-4 rounded-[20px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Numero de Seguimiento
                      </p>
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-300 transition-theme">
                        {correspondence.tracking_number}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="neu-inset p-6 rounded-[28px] text-center">
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">
                    search_off
                  </span>
                  <p className="text-sm text-gray-400">
                    No se encontraron detalles de correspondencia
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer con acciones */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 neu-btn rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all"
            >
              Cerrar
            </button>

            {notification.link && correspondence && (
              <button
                onClick={handleNavigate}
                className="flex-1 h-12 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
              >
                <span>Ir a Correspondencia</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
