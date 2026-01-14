
import React, { useState, useEffect } from 'react';
import { auditService } from '../services/supabase';
import { supabase } from '../services/client';
import { useAuth } from '../hooks/useAuth';

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
  is_legacy?: boolean; // Added for realtime filter
}

export const History: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [error, setError] = useState<string | null>(null);

  // Verificar que solo super_admin puede acceder
  useEffect(() => {
    if (user && !hasRole(['super_admin'])) {
      setError('No tienes permisos para ver el historial de auditoría. Solo los super administradores pueden acceder.');
      setLoading(false);
    }
  }, [user, hasRole]);

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          // Only add if not legacy (future proofing)
          if (!newLog.is_legacy) {
            setLogs((prev) => [newLog, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchLogs = async () => {
    // Solo permitir si es super_admin
    if (!user || !hasRole(['super_admin'])) {
      setError('No tienes permisos para ver el historial de auditoría.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getLogs({ limit: 200 }); // Aumentar límite para ver más eventos
      console.log('Audit logs fetched:', data);
      console.log('Total logs received:', data.length);

      // Filter by date if needed
      let filteredData = data;
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredData = data.filter(log => new Date(log.created_at) >= today);
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredData = data.filter(log => new Date(log.created_at) >= weekAgo);
      }

      console.log('Filtered logs:', filteredData.length);
      setLogs(filteredData);
      
      // Si no hay logs, mostrar mensaje informativo
      if (filteredData.length === 0 && data.length === 0) {
        console.warn('No se encontraron logs de auditoría. Verifica que los triggers estén instalados y funcionando.');
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      setError(error?.message || 'Error al cargar el historial de auditoría. Verifica que tengas permisos de super administrador y que los triggers estén instalados.');
      setLogs([]);
    }
    setLoading(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Mostrar mensaje de error si no tiene permisos
  if (error && !hasRole(['super_admin'])) {
    return (
      <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
        <div className="flex flex-col gap-2 px-4 pt-6 md:pt-0">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100">Historial Log</h1>
          <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg font-bold">Auditoría completa de movimientos y eventos.</p>
        </div>
        <div className="neu-surface rounded-[40px] md:rounded-[60px] p-12 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-500">lock</span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-black text-gray-700 dark:text-gray-200">Acceso Denegado</p>
              <p className="text-sm text-gray-400 font-bold">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 px-4 pt-6 md:pt-0">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100">Historial Log</h1>
        <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg font-bold">Auditoría completa de movimientos y eventos del sistema.</p>
        <p className="text-xs text-gray-400 font-bold">Solo visible para super administradores</p>
      </div>

      <div className="neu-surface rounded-[40px] md:rounded-[60px] p-8 md:p-12 overflow-hidden transition-theme">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-12 mb-8 md:mb-12">
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => setFilter('today')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'today' ? 'neu-inset text-primary' : 'neu-btn text-gray-400'
                }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'week' ? 'neu-inset text-primary' : 'neu-btn text-gray-400'
                }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'neu-inset text-primary' : 'neu-btn text-gray-400'
                }`}
            >
              Todos
            </button>
          </div>
          <button
            onClick={fetchLogs}
            className="neu-btn size-12 md:size-14 flex items-center justify-center rounded-full text-gray-400 hover:text-primary transition-all self-end md:self-auto"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {error && hasRole(['super_admin']) ? (
          <div className="py-12 text-center neu-inset rounded-[40px] flex flex-col items-center gap-4 transition-theme">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-500">error</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-black text-red-500 uppercase tracking-widest">Error al cargar</p>
              <p className="text-xs font-bold text-gray-400">{error}</p>
            </div>
            <button
              onClick={fetchLogs}
              className="neu-btn px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-primary"
            >
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando registros...</span>
          </div>
        ) : logs.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left border-collapse border-spacing-y-3" style={{ borderSpacing: '0 0.75rem' }}>
                <thead>
                  <tr className="border-b-2 border-gray-100 dark:border-gray-800 transition-theme">
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] pl-6 w-[180px]">Evento</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] w-[140px]">Tipo</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Detalles</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] w-[160px]">Usuario</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] w-[180px]">Fecha</th>
                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] text-center pr-6 w-[120px]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="group hover:shadow-sm transition-all relative">
                      <td className="py-6 pl-6 bg-white/40 dark:bg-black/5 rounded-l-[28px] transition-theme">
                        <span className="text-sm font-black text-gray-700 dark:text-gray-300 transition-theme">{getEventLabel(log.event_type)}</span>
                      </td>
                      <td className="py-6 bg-white/40 dark:bg-black/5 transition-theme">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full inline-block">
                          {getResourceTypeLabel(log.resource_type)}
                        </span>
                      </td>
                      <td className="py-6 bg-white/40 dark:bg-black/5 transition-theme">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2 transition-theme">{log.details}</span>
                      </td>
                      <td className="py-6 bg-white/40 dark:bg-black/5 transition-theme">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10 inline-block whitespace-nowrap">
                          {log.user_name || 'Sistema'}
                        </span>
                      </td>
                      <td className="py-6 bg-white/40 dark:bg-black/5 transition-theme">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold transition-theme whitespace-nowrap">{formatDate(log.created_at)}</span>
                      </td>
                      <td className="py-6 text-center bg-white/40 dark:bg-black/5 rounded-r-[28px] transition-theme pr-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest inline-block ${log.status === 'Exitoso' ? 'text-emerald-600' :
                          log.status === 'Fallido' ? 'text-red-500' : 'text-primary'
                          }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid View */}
            <div className="md:hidden flex flex-col gap-6">
              {logs.map((log) => (
                <div key={log.id} className="neu-surface rounded-[30px] p-6 flex flex-col gap-5 border border-gray-100/50 dark:border-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-700 dark:text-gray-300">{getEventLabel(log.event_type)}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(log.created_at)}</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-theme ${log.status === 'Exitoso' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                      log.status === 'Fallido' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                        'text-primary border-primary/20 bg-primary/5'
                      }`}>
                      {log.status}
                    </span>
                  </div>

                  <div className="neu-inset p-4 rounded-2xl flex flex-col gap-2">
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.user_name || 'Sistema'}</span>
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {getResourceTypeLabel(log.resource_type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-24 text-center neu-inset rounded-[40px] flex flex-col items-center gap-4 transition-theme">
            <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700">history</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sin actividad registrada</p>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No hay eventos en el período seleccionado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
