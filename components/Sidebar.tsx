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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onProfileClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, role, isOpen = false, onClose, isCollapsed = false, onToggleCollapse, onProfileClick }) => {
  const getNavItems = () => {
    const items = [
      { id: 'dashboard', label: 'DASHBOARD', icon: 'dashboard', roles: ['super_admin', 'admin', 'recepcionista'] },
      { id: 'management', label: 'CORRESPONDENCIA', icon: 'inbox', roles: ['super_admin', 'admin', 'recepcionista'] },
      { id: 'history', label: 'HISTORIAL LOG', icon: 'history', roles: ['super_admin'] }, // Solo super_admin puede ver historial de auditoría
      { id: 'users', label: 'USUARIOS', icon: 'group', roles: ['super_admin', 'admin'] },
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
        flex flex-col h-[calc(100vh-2rem)]
        fixed lg:sticky top-4 lg:top-4 left-4 lg:left-0 lg:ml-4 mb-4
        z-[60] lg:z-auto
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-[calc(100vw-2rem)] md:w-80' : '-translate-x-[200%] lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[104px]' : 'w-[calc(100vw-2rem)] md:w-80'}
      `}>
        <div className="glass h-full rounded-[60px] flex flex-col shadow-xl transition-all relative overflow-hidden duration-300 ease-in-out" style={{ padding: isCollapsed ? '1.5rem 1rem' : '2rem 2rem' }}>

          {/* Desktop Toggle Button */}
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute top-5 right-5 size-10 items-center justify-center rounded-full neu-btn text-primary hover:scale-110 transition-all z-20"
              title="Contraer"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
            </button>
          )}

          <div className="flex-1 lg:overflow-y-visible overflow-y-auto overflow-x-hidden -mr-4 pr-4 custom-scrollbar">
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 lg:hidden z-10 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>

            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-6 justify-center px-0 mb-8' : 'gap-4 px-2 mb-8'}`}>
              {isCollapsed && onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="neu-btn size-14 p-3 rounded-[20px] text-primary flex items-center justify-center hover:scale-110 transition-all shrink-0"
                  title="Expandir"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              )}
              {isCollapsed ? (
                <div className="neu-btn size-14 p-3 rounded-[20px] bg-gray-900 dark:bg-gray-800 flex items-center justify-center transition-theme shrink-0">
                  <span className="text-white text-2xl font-black">B</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {VADAVO_LOGO}
                </div>
              )}
            </div>

            <nav className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'gap-2.5' : 'gap-2.5'}`}>
              {getNavItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    onClose?.(); // Close menu on selection (mobile)
                  }}
                  className={`flex items-center transition-all group w-full ${
                    isCollapsed
                      ? 'justify-center size-14 rounded-[20px] p-3'
                      : 'gap-5 px-5 py-4 rounded-full'
                  } ${currentView === item.id
                    ? 'neu-inset text-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-black/10'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`material-symbols-outlined transition-theme shrink-0 ${
                    isCollapsed ? 'text-[20px]' : 'text-[22px]'
                  } ${currentView === item.id ? 'text-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-[11px] font-black uppercase tracking-[0.1em] whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className={`transition-all duration-300 shrink-0 ${isCollapsed ? 'pt-3 mt-2 flex flex-col gap-2 items-center' : 'pt-4 mt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2'}`}>
            {/* Botón de Perfil */}
            <div
              onClick={onProfileClick || (() => setView('settings'))}
              className={`neu-btn flex items-center hover:scale-[1.03] transition-all cursor-pointer overflow-hidden ${
                isCollapsed ? 'size-14 rounded-[20px] p-3 justify-center' : 'p-3.5 gap-3 rounded-[32px] w-full'
              }`}
              title={isCollapsed ? 'Mi perfil' : undefined}
            >
              <div className={`overflow-hidden shadow-inner bg-primary/10 flex items-center justify-center shrink-0 transition-all ${
                isCollapsed ? 'size-8 rounded-[12px]' : 'size-10 rounded-[16px]'
              }`}>
                <span className={`material-symbols-outlined text-primary ${isCollapsed ? 'text-[20px]' : 'text-[22px]'}`}>person</span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-gray-700 dark:text-gray-300 text-xs font-black truncate transition-theme uppercase leading-tight">Mi Perfil</p>
                    <p className={`${roleLabels[role].color} text-[8px] font-black uppercase tracking-widest mt-0.5 truncate leading-tight`}>{roleLabels[role].label}</p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-gray-400 text-base shrink-0">settings</span>
                </>
              )}
            </div>

            {/* Botón de Logout */}
            <div
              onClick={onLogout}
              className={`neu-btn flex items-center hover:scale-[1.03] transition-all cursor-pointer overflow-hidden ${
                isCollapsed ? 'size-14 rounded-[20px] p-3 justify-center' : 'p-3.5 gap-3 rounded-[32px] w-full'
              }`}
              title={isCollapsed ? 'Cerrar sesión' : undefined}
            >
              <div className={`overflow-hidden shadow-inner bg-red-500/10 flex items-center justify-center shrink-0 transition-all ${
                isCollapsed ? 'size-8 rounded-[12px]' : 'size-10 rounded-[16px]'
              }`}>
                <span className={`material-symbols-outlined text-red-500 ${isCollapsed ? 'text-[20px]' : 'text-[22px]'}`}>logout</span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-gray-700 dark:text-gray-300 text-xs font-black truncate transition-theme uppercase leading-tight">Cerrar Sesión</p>
                    <p className="text-red-500 text-[8px] font-black uppercase tracking-widest mt-0.5 truncate leading-tight">SALIR</p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-gray-400 text-base shrink-0">power_settings_new</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
