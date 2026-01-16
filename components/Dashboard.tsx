
import React, { useState, useEffect } from 'react';
import { correspondenceService, storageConfigService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { StorageOverview } from '../types';

// Storage Indicator Component
interface StorageIndicatorProps {
  label: string;
  icon: string;
  used: number;
  max: number;
  percentage: number;
  warningThreshold: number;
  criticalThreshold: number;
}

const StorageIndicator: React.FC<StorageIndicatorProps> = ({
  label, icon, used, max, percentage, warningThreshold, criticalThreshold
}) => {
  const getStrokeColor = () => {
    if (percentage >= criticalThreshold) return 'stroke-red-500';
    if (percentage >= warningThreshold) return 'stroke-amber-500';
    return 'stroke-primary';
  };

  const getAlertStatus = () => {
    if (percentage >= criticalThreshold) return { icon: 'error', text: 'Crítico', color: 'text-red-500' };
    if (percentage >= warningThreshold) return { icon: 'warning', text: 'Alerta', color: 'text-amber-500' };
    return null;
  };

  const alert = getAlertStatus();
  const circumference = 2 * Math.PI * 40; // r=40

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-gray-100 dark:stroke-gray-800 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={`fill-none transition-all duration-1000 ${getStrokeColor()}`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * Math.min(percentage, 100) / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-black text-gray-700 dark:text-gray-100">{percentage}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-gray-400">{icon}</span>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[9px] font-bold text-gray-500">{used}/{max} unid.</span>
      {alert && (
        <div className={`flex items-center gap-1 ${alert.color} animate-pulse`}>
          <span className="material-symbols-outlined text-xs">{alert.icon}</span>
          <span className="text-[8px] font-black uppercase tracking-widest">{alert.text}</span>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeStorageTab, setActiveStorageTab] = useState<'status' | 'config'>('status');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    monthlyInbound: number;
    pendingPickup: number;
    totalDigitized: number;
    activityByDay: number[];
    notificationEfficiency: number;
    storage: StorageOverview;
  }>({
    monthlyInbound: 0,
    pendingPickup: 0,
    totalDigitized: 0,
    activityByDay: [0, 0, 0, 0, 0, 0, 0],
    notificationEfficiency: 100,
    storage: {
      packages: { used: 0, max: 50, percentage: 0, warningThreshold: 70, criticalThreshold: 90 },
      letters: { used: 0, max: 200, percentage: 0, warningThreshold: 70, criticalThreshold: 90 }
    }
  });

  // Config form state
  const [configForm, setConfigForm] = useState({
    max_packages: 50,
    max_letters: 200,
    packages_warning_threshold: 70,
    packages_critical_threshold: 90,
    letters_warning_threshold: 70,
    letters_critical_threshold: 90
  });

  // Permissions
  const canEditStorage = user && storageConfigService.canEdit(user.role);
  const canViewConfig = user && storageConfigService.canView(user.role);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await correspondenceService.getDashboardStats();
      setDashboardData(data);

      // Initialize config form with current values
      if (data.storage) {
        setConfigForm({
          max_packages: data.storage.packages.max,
          max_letters: data.storage.letters.max,
          packages_warning_threshold: data.storage.packages.warningThreshold,
          packages_critical_threshold: data.storage.packages.criticalThreshold,
          letters_warning_threshold: data.storage.letters.warningThreshold,
          letters_critical_threshold: data.storage.letters.criticalThreshold
        });
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  const handleSaveConfig = async () => {
    if (!canEditStorage) return;

    setSaving(true);
    const { error } = await storageConfigService.updateConfig(configForm);

    if (error) {
      showToast(`Error al guardar: ${error}`, 'error');
      setSaving(false);
      return;
    }

    // Refresh dashboard data with new config
    const data = await correspondenceService.getDashboardStats();
    setDashboardData(data);

    // Update config form with refreshed values
    if (data.storage) {
      setConfigForm({
        max_packages: data.storage.packages.max,
        max_letters: data.storage.letters.max,
        packages_warning_threshold: data.storage.packages.warningThreshold,
        packages_critical_threshold: data.storage.packages.criticalThreshold,
        letters_warning_threshold: data.storage.letters.warningThreshold,
        letters_critical_threshold: data.storage.letters.criticalThreshold
      });
    }

    showToast('Configuración guardada correctamente', 'success');
    setSaving(false);
  };

  const stats = [
    { label: 'Entradas Mes', value: dashboardData.monthlyInbound.toString(), change: '+Active', icon: 'input' },
    { label: 'Digitalizaciones', value: dashboardData.totalDigitized.toString(), change: 'Total', icon: 'document_scanner' },
    { label: 'Pendientes Recogida', value: dashboardData.pendingPickup.toString(), change: 'En almacén', icon: 'inventory' },
    { label: 'Eficiencia Notificación', value: `${dashboardData.notificationEfficiency}%`, change: dashboardData.notificationEfficiency >= 90 ? 'Altos' : 'Bajo', icon: 'bolt' },
  ];

  const barData = dashboardData.activityByDay.map(val => {
    const max = Math.max(...dashboardData.activityByDay, 10);
    return (val / max) * 100;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 px-4 pt-6 md:pt-0">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100 transition-theme">Botánico Coworking</h1>
        <p className="text-gray-400 dark:text-gray-500 text-base lg:text-lg font-bold">Resumen operativo de la Oficina Virtual.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="neu-surface rounded-[40px] p-6 lg:p-8 flex flex-col gap-4 group hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start">
              <div className="neu-inset size-12 lg:size-14 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl lg:text-[28px]">{stat.icon}</span>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-black text-gray-700 dark:text-gray-200">{stat.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Actividad de Digitalización Card */}
        <div className="lg:col-span-2 neu-surface rounded-[60px] p-8 lg:p-12 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg lg:text-xl font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Actividad de Digitalización</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documentación procesada por día</p>
            </div>
            <div className="size-10 lg:size-12 rounded-full neu-btn flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] flex items-end justify-between gap-3 sm:gap-6 px-2 lg:px-4">
            {barData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 lg:gap-6 h-full">
                <div className="w-full relative group h-full flex items-end">
                  <div className="absolute inset-x-0 bottom-0 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-full opacity-30"></div>
                  <div
                    className="w-full relative z-10 neu-btn rounded-full transition-all duration-700 ease-out flex items-center justify-center overflow-hidden"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute inset-0 bg-primary opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute bottom-2 lg:bottom-4 size-1.5 lg:size-2.5 bg-primary rounded-full group-hover:scale-125 transition-transform"></div>
                  </div>
                </div>
                <span className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {i === 6 ? 'Hoy' : i === 5 ? 'Ayer' : `-${6 - i}d`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Almacén Card */}
        <div className="neu-surface rounded-[60px] p-8 lg:p-10 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="text-lg lg:text-xl font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Almacén</h2>
            <div className="flex neu-inset rounded-full p-1.5 shrink-0">
              <button
                onClick={() => setActiveStorageTab('status')}
                className={`size-10 flex items-center justify-center rounded-full transition-all ${activeStorageTab === 'status' ? 'neu-btn text-primary' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-xl">pie_chart</span>
              </button>
              {canViewConfig && (
                <button
                  onClick={() => setActiveStorageTab('config')}
                  className={`size-10 flex items-center justify-center rounded-full transition-all ${activeStorageTab === 'config' ? 'neu-btn text-primary' : 'text-gray-400'}`}
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {activeStorageTab === 'status' ? (
              <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in zoom-in duration-300 px-4">
                {/* Dual Storage Indicators */}
                <div className="flex gap-8 justify-center items-start">
                  <StorageIndicator
                    label="Paquetes"
                    icon="package_2"
                    used={dashboardData.storage.packages.used}
                    max={dashboardData.storage.packages.max}
                    percentage={dashboardData.storage.packages.percentage}
                    warningThreshold={dashboardData.storage.packages.warningThreshold}
                    criticalThreshold={dashboardData.storage.packages.criticalThreshold}
                  />
                  <StorageIndicator
                    label="Cartas"
                    icon="mail"
                    used={dashboardData.storage.letters.used}
                    max={dashboardData.storage.letters.max}
                    percentage={dashboardData.storage.letters.percentage}
                    warningThreshold={dashboardData.storage.letters.warningThreshold}
                    criticalThreshold={dashboardData.storage.letters.criticalThreshold}
                  />
                </div>
                <div className="mt-6 text-center w-full">
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">
                    Ocupación de almacén por tipo
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 py-2 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto">
                {/* Packages Config */}
                <div className="px-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm text-primary">package_2</span>
                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Paquetes</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacidad máx.</label>
                      <input
                        type="number"
                        min="1"
                        value={configForm.max_packages}
                        onChange={(e) => setConfigForm({ ...configForm, max_packages: parseInt(e.target.value) || 1 })}
                        disabled={!canEditStorage}
                        className="w-16 text-right text-xs font-black text-primary bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Alerta ({configForm.packages_warning_threshold}%)</label>
                      <input
                        type="range"
                        min="50" max="95"
                        value={configForm.packages_warning_threshold}
                        onChange={(e) => setConfigForm({ ...configForm, packages_warning_threshold: parseInt(e.target.value) })}
                        disabled={!canEditStorage}
                        className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-amber-500 cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Crítico ({configForm.packages_critical_threshold}%)</label>
                      <input
                        type="range"
                        min="60" max="100"
                        value={configForm.packages_critical_threshold}
                        onChange={(e) => setConfigForm({ ...configForm, packages_critical_threshold: parseInt(e.target.value) })}
                        disabled={!canEditStorage}
                        className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-red-500 cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 mx-4"></div>

                {/* Letters Config */}
                <div className="px-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm text-primary">mail</span>
                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Cartas</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacidad máx.</label>
                      <input
                        type="number"
                        min="1"
                        value={configForm.max_letters}
                        onChange={(e) => setConfigForm({ ...configForm, max_letters: parseInt(e.target.value) || 1 })}
                        disabled={!canEditStorage}
                        className="w-16 text-right text-xs font-black text-primary bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Alerta ({configForm.letters_warning_threshold}%)</label>
                      <input
                        type="range"
                        min="50" max="95"
                        value={configForm.letters_warning_threshold}
                        onChange={(e) => setConfigForm({ ...configForm, letters_warning_threshold: parseInt(e.target.value) })}
                        disabled={!canEditStorage}
                        className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-amber-500 cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Crítico ({configForm.letters_critical_threshold}%)</label>
                      <input
                        type="range"
                        min="60" max="100"
                        value={configForm.letters_critical_threshold}
                        onChange={(e) => setConfigForm({ ...configForm, letters_critical_threshold: parseInt(e.target.value) })}
                        disabled={!canEditStorage}
                        className="w-20 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-red-500 cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button (only for admins) */}
                {canEditStorage && (
                  <div className="mt-auto px-4 pt-2">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="w-full neu-btn py-3 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin size-3 border-2 border-primary border-t-transparent rounded-full"></span>
                          Guardando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">save</span>
                          Guardar Cambios
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Info for non-editors */}
                {!canEditStorage && canViewConfig && (
                  <div className="mt-auto px-4">
                    <div className="neu-inset p-4 rounded-2xl">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-relaxed text-center">
                        Solo administradores pueden modificar la configuración
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
