
import React, { useState, useEffect } from 'react';
import { auditService } from '../services/supabase';
import { supabase } from '../services/client';
import { useAuth } from '../hooks/useAuth';
import { AuditLogDetailModal } from './AuditLogDetailModal';

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
  is_legacy?: boolean;
}

interface UserOption {
  id: string;
  full_name: string;
}

export const History: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(50);

  // Filtros
  const [filters, setFilters] = useState({
    eventType: '',
    resourceType: '',
    status: '',
    userId: '',
    startDate: '',
    endDate: ''
  });

  // Opciones de usuarios para el filtro
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  // Verificar que solo super_admin puede acceder
  useEffect(() => {
    if (user && !hasRole(['super_admin'])) {
      setError('No tienes permisos para ver el historial de auditoría. Solo los super administradores pueden acceder.');
      setLoading(false);
    }
  }, [user, hasRole]);

  // Cargar usuarios para el filtro
  useEffect(() => {
    const loadUsers = async () => {
      if (user && hasRole(['super_admin'])) {
        const users = await auditService.getUsers();
        setUserOptions(users);
      }
    };
    loadUsers();
  }, [user, hasRole]);

  // Cargar logs cuando cambien los filtros o la página
  useEffect(() => {
    if (user && hasRole(['super_admin'])) {
      fetchLogs();
    }
  }, [currentPage, filters, user, hasRole]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user || !hasRole(['super_admin'])) return;

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
          // Solo agregar si no es legacy y estamos en la primera página sin filtros
          if (!newLog.is_legacy && currentPage === 1 && !hasActiveFilters()) {
            setLogs((prev) => [newLog, ...prev.slice(0, itemsPerPage - 1)]);
            setTotalCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hasRole, currentPage]);

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const fetchLogs = async () => {
    if (!user || !hasRole(['super_admin'])) {
      setError('No tienes permisos para ver el historial de auditoría.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;

      const { data, count } = await auditService.getLogs({
        limit: itemsPerPage,
        offset,
        eventType: filters.eventType || undefined,
        resourceType: filters.resourceType || undefined,
        status: filters.status || undefined,
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });

      console.log('Audit logs fetched:', data);
      console.log('Total logs:', count);

      setLogs(data);
      setTotalCount(count);

      if (data.length === 0 && count === 0 && !hasActiveFilters()) {
        console.warn('No se encontraron logs de auditoría. Verifica que los triggers estén instalados y funcionando.');
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  };

  const clearFilters = () => {
    setFilters({
      eventType: '',
      resourceType: '',
      status: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
    <>
      <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
        <div className="flex flex-col gap-2 px-4 pt-6 md:pt-0">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100">Historial Log</h1>
          <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg font-bold">Auditoría completa de movimientos y eventos del sistema.</p>
          <p className="text-xs text-gray-400 font-bold">Solo visible para super administradores</p>
        </div>

        <div className="neu-surface rounded-[40px] md:rounded-[60px] p-8 md:p-12 overflow-hidden transition-theme">
          {/* Filtros */}
          <div className="mb-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Filtros de Búsqueda</h2>
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="neu-btn px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={fetchLogs}
                  className="neu-btn size-12 flex items-center justify-center rounded-full text-gray-400 hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>
            </div>

            {/* Grid de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de Evento */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tipo de Evento</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                >
                  <option value="">Todos</option>
                  <option value="CREATE">Registro Creado</option>
                  <option value="UPDATE">Actualización</option>
                  <option value="DELETE">Eliminación</option>
                  <option value="NOTIFY">Notificación Enviada</option>
                  <option value="DELIVER">Entrega Realizada</option>
                  <option value="DIGITIZE">Documento Digitalizado</option>
                  <option value="STATUS_CHANGE">Cambio de Estado</option>
                  <option value="LOGIN">Inicio de Sesión</option>
                </select>
              </div>

              {/* Tipo de Recurso */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tipo de Recurso</label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                >
                  <option value="">Todos</option>
                  <option value="CORRESPONDENCE">Correspondencia</option>
                  <option value="USER">Usuario</option>
                  <option value="AUTH">Autenticación</option>
                </select>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                >
                  <option value="">Todos</option>
                  <option value="Exitoso">Exitoso</option>
                  <option value="Fallido">Fallido</option>
                  <option value="Informativo">Informativo</option>
                </select>
              </div>

              {/* Usuario */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Usuario</label>
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                >
                  <option value="">Todos</option>
                  {userOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Fecha Inicio */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Fecha Inicio</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                />
              </div>

              {/* Fecha Fin */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Fecha Fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 focus:ring-0 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Indicador de filtros activos */}
            {hasActiveFilters() && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <span className="material-symbols-outlined text-primary text-xl">filter_alt</span>
                <p className="text-xs font-bold text-primary">
                  Mostrando {logs.length} de {totalCount} registros filtrados
                </p>
              </div>
            )}
          </div>

          {/* Contenido */}
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
                      <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] text-center pr-6 w-[100px]">Acción</th>
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
                        <td className="py-6 text-center bg-white/40 dark:bg-black/5 transition-theme">
                          <span className={`text-[9px] font-black uppercase tracking-widest inline-block ${log.status === 'Exitoso' ? 'text-emerald-600' :
                            log.status === 'Fallido' ? 'text-red-500' : 'text-primary'
                            }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-6 text-center bg-white/40 dark:bg-black/5 rounded-r-[28px] transition-theme pr-6">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="neu-btn size-9 rounded-full flex items-center justify-center text-primary hover:scale-110 transition-all mx-auto"
                            title="Ver detalles"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          {getResourceTypeLabel(log.resource_type)}
                        </span>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="neu-btn size-9 rounded-full flex items-center justify-center text-primary hover:scale-110 transition-all"
                          title="Ver detalles"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-gray-400 font-bold">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} registros
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="neu-btn size-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`size-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              currentPage === pageNum
                                ? 'neu-inset text-primary'
                                : 'neu-btn text-gray-400 hover:text-primary'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="neu-btn size-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center neu-inset rounded-[40px] flex flex-col items-center gap-4 transition-theme">
              <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700">history</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Sin actividad registrada</p>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">
                  {hasActiveFilters() ? 'No hay eventos que coincidan con los filtros' : 'No hay eventos en el período seleccionado'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
};
