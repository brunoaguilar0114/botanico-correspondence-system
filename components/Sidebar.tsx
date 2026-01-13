import React from 'react';
import { VADAVO_LOGO } from '../constants';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, role, isOpen = false, onClose }) => {
  const getNavItems = () => {
    const items = [
      { id: 'dashboard', label: 'DASHBOARD', icon: 'dashboard', roles: ['super_admin', 'admin', 'recepcionista'] },
      { id: 'management', label: 'CORRESPONDENCIA', icon: 'inbox', roles: ['super_admin', 'admin', 'recepcionista'] },
      { id: 'history', label: 'HISTORIAL LOG', icon: 'history', roles: ['super_admin'] }, // Solo super_admin puede ver historial de auditoría
      { id: 'users', label: 'USUARIOS', icon: 'group', roles: ['super_admin', 'admin'] },
      { id: 'settings', label: 'MI PERFIL', icon: 'settings', roles: ['super_admin', 'admin', 'recepcionista'] },
    ];
    // Filter items first
    return items.filter(item => item.roles.includes(role));
  };

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'ACCESO MAESTRO', color: 'text-primary' },
    admin: { label: 'ADMINISTRADOR', color: 'text-emerald-500' },
    recepcionista: { label: 'RECEPCIÓN', color: 'text-blue-500' },
    cliente: { label: 'CLIENTE', color: 'text-gray-400' }
  };

  if (role === 'cliente') return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-[calc(100vw-2rem)] md:w-80 flex flex-col h-[calc(100vh-2rem)] 
        fixed lg:sticky top-4 lg:top-4 left-4 lg:left-0 lg:ml-4 mb-4
        z-[60] lg:z-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-[200%] lg:translate-x-0'}
      `}>
        <div className="glass h-full rounded-[60px] flex flex-col p-8 md:p-10 shadow-xl transition-theme relative overflow-hidden">

          <div className="flex-1 overflow-y-auto overflow-x-hidden -mr-4 pr-4 custom-scrollbar">
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 lg:hidden z-10 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>

            <div className="flex items-center gap-5 mb-12 px-2 pt-2">
              <div className="neu-btn size-14 p-3 rounded-[20px] text-primary flex items-center justify-center transition-theme shrink-0">
                {VADAVO_LOGO}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-gray-700 dark:text-gray-100 text-2xl font-black leading-none tracking-tight transition-theme truncate">Vadavo</h1>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-2 truncate">ENTERPRISE</p>
              </div>
            </div>

            <nav className="flex flex-col gap-4">
              {getNavItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    onClose?.(); // Close menu on selection (mobile)
                  }}
                  className={`flex items-center gap-6 px-6 md:px-8 py-5 rounded-full transition-theme group w-full ${currentView === item.id
                    ? 'neu-inset text-primary'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/30 dark:hover:bg-black/10'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[24px] transition-theme shrink-0 ${currentView === item.id ? 'text-primary' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-800 transition-theme shrink-0">
            <div onClick={onLogout} className="neu-btn p-4 md:p-5 rounded-[40px] flex items-center gap-4 hover:scale-[1.03] transition-all cursor-pointer overflow-hidden">
              <div className="size-12 rounded-[18px] overflow-hidden shadow-inner bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-black truncate transition-theme uppercase">Sesión</p>
                <p className={`${roleLabels[role].color} text-[9px] font-black uppercase tracking-widest mt-0.5 truncate`}>{roleLabels[role].label}</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-gray-400 text-sm shrink-0">logout</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
