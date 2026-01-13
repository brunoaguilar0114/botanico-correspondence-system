
import React, { useState, useEffect } from 'react';
import { correspondenceService } from '../services/supabase';

export const Dashboard: React.FC = () => {
  const [activeStorageTab, setActiveStorageTab] = useState<'status' | 'config'>('status');
  const [storageThreshold, setStorageThreshold] = useState(80);
  const [storageUsage, setStorageUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    monthlyInbound: number;
    pendingPickup: number;
    totalDigitized: number;
    activityByDay: number[];
  }>({
    monthlyInbound: 0,
    pendingPickup: 0,
    totalDigitized: 0,
    activityByDay: [0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await correspondenceService.getDashboardStats();
      setDashboardData(data);

      // Calculate realistic storage usage (e.g., 2% per pending item, cap at 100)
      const calculatedUsage = Math.min(Math.round(data.pendingPickup * 2.5), 100);
      setStorageUsage(calculatedUsage);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const stats = [
    { label: 'Entradas Mes', value: dashboardData.monthlyInbound.toString(), change: '+Active', icon: 'input' },
    { label: 'Digitalizaciones', value: dashboardData.totalDigitized.toString(), change: 'Total', icon: 'document_scanner' },
    { label: 'Pendientes Recogida', value: dashboardData.pendingPickup.toString(), change: 'En almacén', icon: 'inventory' },
    { label: 'Eficiencia Notificación', value: '98%', change: 'Altos', icon: 'bolt' },
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
      <div className="flex flex-col gap-2 px-4">
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
              <button
                onClick={() => setActiveStorageTab('config')}
                className={`size-10 flex items-center justify-center rounded-full transition-all ${activeStorageTab === 'config' ? 'neu-btn text-primary' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-xl">tune</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {activeStorageTab === 'status' ? (
              <div className="flex-1 flex flex-col justify-center items-center animate-in fade-in zoom-in duration-300 px-4">
                <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 p-4 overflow-visible" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      className="stroke-gray-100 dark:stroke-gray-800 fill-none"
                      strokeWidth="20"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      className={`fill-none transition-all duration-1000 ${storageUsage > storageThreshold ? 'stroke-red-500' : 'stroke-primary'}`}
                      strokeWidth="20"
                      strokeDasharray="534.07"
                      strokeDashoffset={534.07 - (534.07 * storageUsage / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl lg:text-5xl font-black text-gray-700 dark:text-gray-100">{storageUsage}%</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Capacidad</span>
                  </div>
                </div>
                <div className="mt-8 text-center w-full">
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">
                    Uso de taquillas para bultos físicos
                  </p>
                  {storageUsage > storageThreshold && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-red-500 animate-pulse">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Alerta de capacidad</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uso Simulado</label>
                    <span className="text-xs font-black text-primary">{storageUsage}%</span>
                  </div>
                  <div className="px-4">
                    <input
                      type="range"
                      min="0" max="100"
                      value={storageUsage}
                      onChange={(e) => setStorageUsage(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-primary cursor-pointer transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Umbral de Alerta</label>
                    <span className="text-xs font-black text-primary">{storageThreshold}%</span>
                  </div>
                  <div className="px-4">
                    <input
                      type="range"
                      min="50" max="95"
                      value={storageThreshold}
                      onChange={(e) => setStorageThreshold(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-800 accent-primary cursor-pointer transition-all"
                    />
                  </div>
                </div>

                <div className="mt-auto px-4">
                  <div className="neu-inset p-5 lg:p-6 rounded-[30px]">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-relaxed">
                      Configura los límites del sistema para disparar notificaciones automáticas al personal de recepción cuando el almacén físico esté próximo al colapso.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
