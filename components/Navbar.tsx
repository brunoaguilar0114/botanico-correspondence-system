
import React, { useState, useEffect, useRef } from 'react';
import { VADAVO_LOGO } from '../constants';
import { User } from '../types';
import { useNotificationSystem } from '../contexts/NotificationSystemContext';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onMenuClick?: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onProfileClick, isDarkMode, onToggleTheme, onMenuClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationSystem();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between glass px-8 py-5 lg:px-12 sticky top-4 mx-4 lg:mx-8 rounded-full z-50 shadow-lg transition-theme">
      <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 lg:hidden">
        {/* Mobile Menu Trigger */}
        {/* Mobile Menu Trigger - Hidden for clients */}
        {user.role !== 'cliente' && (
          <button
            onClick={onMenuClick}
            className="size-10 p-2 neu-btn rounded-xl text-primary transition-theme flex items-center justify-center active:scale-95"
            title="Abrir Menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        {/* Logo (Hidden on very small screens if needed, but keeping for now) */}
        <div className="size-10 p-2 neu-btn rounded-xl text-primary transition-theme hidden sm:block">
          {VADAVO_LOGO}
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Vadavo</h2>
      </div>

      <div className="hidden lg:block ml-4">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Corporativo</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-bold transition-theme">Bienvenido, <span className="text-primary">{user.name}</span></p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="size-12 flex items-center justify-center rounded-full neu-btn text-gray-500 hover:text-red-500 transition-theme hidden sm:flex"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[24px]">logout</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="size-12 flex items-center justify-center rounded-full neu-btn text-gray-500 dark:text-gray-400 hover:text-primary transition-theme"
            title={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative size-12 flex items-center justify-center rounded-full transition-theme ${isNotificationsOpen ? 'neu-inset text-primary' : 'neu-btn text-gray-500 dark:text-gray-400 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3 size-2.5 bg-primary rounded-full ring-4 ring-neu-bg-light dark:ring-neu-bg-dark transition-theme animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-6 w-80 glass rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-white/20 dark:border-white/10">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/10 dark:bg-black/10">
                  <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">NOTIFICACIONES</h3>
                </div>
                <div className="max-h-[350px] overflow-y-auto py-3">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`px-8 py-5 hover:bg-white/60 dark:hover:bg-black/30 cursor-pointer transition-colors flex gap-5 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 transition-theme">{n.title}</p>
                            {!n.read && <div className="size-2 bg-primary rounded-full mt-1"></div>}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed font-semibold transition-theme">{n.message}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black mt-1 uppercase tracking-widest">
                            {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-8 py-10 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No hay notificaciones</p>
                    </div>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="w-full py-5 text-[11px] font-black text-primary uppercase tracking-[0.3em] hover:bg-primary/10 transition-all border-t border-gray-200 dark:border-gray-800"
                  >
                    MARCAR TODAS COMO LEÍDAS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-10 w-px bg-gray-300 dark:bg-gray-700 mx-2 transition-theme"></div>

        <button
          onClick={onProfileClick}
          className="flex items-center gap-5 group mr-2"
          title="Ver Perfil"
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-black text-gray-700 dark:text-gray-300 group-hover:text-primary transition-theme">{user.name}</span>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${user.role === 'super_admin' ? 'text-primary' :
              user.role === 'admin' ? 'text-emerald-500' :
                user.role === 'recepcionista' ? 'text-blue-500' : 'text-gray-400'
              }`}>{user.role.replace('_', ' ')}</span>
          </div>
          <div className="size-12 rounded-[18px] neu-btn p-1 overflow-hidden transition-theme group-hover:scale-105 flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <span className="material-symbols-outlined text-primary">person</span>
            )}
          </div>
        </button>

        <button
          onClick={onLogout}
          className="size-10 flex items-center justify-center rounded-full neu-inset text-gray-400 hover:text-red-500 transition-colors lg:hidden"
          title="Cerrar Sesión"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </header>
  );
};
