
import React, { useState, useEffect, useRef } from 'react';
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
    <header className="flex items-center justify-between glass px-4 py-4 sm:px-8 sm:py-5 lg:px-12 sticky top-4 mx-4 lg:mx-8 rounded-full z-50 shadow-lg transition-theme">
      <div className="flex items-center gap-2 sm:gap-4 text-gray-700 dark:text-gray-300 lg:hidden min-w-0">
        {/* Mobile Menu Trigger - Hidden for clients */}
        {user.role !== 'cliente' && (
          <button
            onClick={onMenuClick}
            className="size-10 p-2 neu-btn rounded-xl text-primary transition-theme flex items-center justify-center active:scale-95 shrink-0"
            title="Abrir Menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        {/* Logo and Title - Compact */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 p-2 rounded-xl bg-gray-900 dark:bg-gray-800 transition-theme flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-black">B</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate">Botánico</h2>
        </div>
      </div>

      <div className="hidden lg:block ml-4">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Corporativo</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-bold transition-theme">Bienvenido, <span className="text-primary">{user.name}</span></p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Logout button - Desktop only para staff */}
          {user.role !== 'cliente' && (
            <button
              onClick={onLogout}
              className="size-10 sm:size-12 flex items-center justify-center rounded-full neu-btn text-gray-500 hover:text-red-500 transition-theme hidden lg:flex"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">logout</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="size-10 sm:size-12 flex items-center justify-center rounded-full neu-btn text-gray-500 dark:text-gray-400 hover:text-primary transition-theme shrink-0"
            title={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative size-10 sm:size-12 flex items-center justify-center rounded-full transition-theme shrink-0 ${isNotificationsOpen ? 'neu-inset text-primary' : 'neu-btn text-gray-500 dark:text-gray-400 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 size-2 sm:size-2.5 bg-primary rounded-full ring-3 sm:ring-4 ring-neu-bg-light dark:ring-neu-bg-dark transition-theme animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 sm:mt-6 w-[calc(100vw-2rem)] sm:w-80 glass rounded-[30px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-white/20 dark:border-white/10">
                <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/10 dark:bg-black/10">
                  <h3 className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">NOTIFICACIONES</h3>
                </div>
                <div className="max-h-[300px] sm:max-h-[350px] overflow-y-auto py-2 sm:py-3">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`px-5 sm:px-8 py-4 sm:py-5 hover:bg-white/60 dark:hover:bg-black/30 cursor-pointer transition-colors flex gap-3 sm:gap-5 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex flex-col gap-1 sm:gap-1.5 w-full min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 transition-theme truncate">{n.title}</p>
                            {!n.read && <div className="size-2 bg-primary rounded-full mt-1 shrink-0"></div>}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed font-semibold transition-theme line-clamp-2">{n.message}</p>
                          <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-600 font-black mt-1 uppercase tracking-widest">
                            {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 sm:px-8 py-8 sm:py-10 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No hay notificaciones</p>
                    </div>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="w-full py-4 sm:py-5 text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-[0.3em] hover:bg-primary/10 transition-all border-t border-gray-200 dark:border-gray-800"
                  >
                    MARCAR TODAS COMO LEÍDAS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-8 sm:h-10 w-px bg-gray-300 dark:bg-gray-700 mx-1 sm:mx-2 transition-theme shrink-0"></div>

        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 sm:gap-3 lg:gap-5 group shrink-0"
          title="Ver Perfil"
        >
          <div className="flex flex-col items-end hidden sm:flex min-w-0">
            <span className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 group-hover:text-primary transition-theme truncate">{user.name}</span>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold ${user.role === 'super_admin' ? 'text-primary' :
              user.role === 'admin' ? 'text-emerald-500' :
                user.role === 'recepcionista' ? 'text-blue-500' : 'text-gray-400'
              }`}>{user.role.replace('_', ' ')}</span>
          </div>
          <div className="size-10 sm:size-12 rounded-[14px] sm:rounded-[18px] neu-btn p-1 overflow-hidden transition-theme group-hover:scale-105 flex items-center justify-center shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[10px] sm:rounded-[14px]" />
            ) : (
              <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px]">person</span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
