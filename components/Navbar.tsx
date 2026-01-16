
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const { notifications, unreadCount, markAllAsRead, onNotificationClick } = useNotificationSystem();
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect if mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  // Store position for fixed dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isNotificationsOpen && bellButtonRef.current && !isMobile) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12, // 12px gap below button
        right: window.innerWidth - rect.right
      });
    }
  }, [isNotificationsOpen, isMobile]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isNotificationsOpen || isMobile) return;

    const updatePosition = () => {
      if (bellButtonRef.current) {
        const rect = bellButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 12,
          right: window.innerWidth - rect.right
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isNotificationsOpen, isMobile]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideButton = bellButtonRef.current && !bellButtonRef.current.contains(target);

      if (isOutsideDropdown && isOutsideButton) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    onNotificationClick(notification);
    setIsNotificationsOpen(false);
  };

  // Desktop dropdown rendered via portal
  const renderDesktopDropdown = () => {
    if (!isNotificationsOpen || isMobile) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] w-80 max-w-[calc(100vw-2rem)] glass rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-white/10"
        style={{
          top: dropdownPosition.top,
          right: dropdownPosition.right
        }}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/10 dark:bg-black/10 rounded-t-[24px]">
          <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">NOTIFICACIONES</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} nuevas
            </span>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-6 py-4 hover:bg-white/60 dark:hover:bg-black/30 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 transition-theme line-clamp-1">{n.title}</p>
                    {!n.read && <div className="size-2 bg-primary rounded-full mt-1.5 shrink-0"></div>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium transition-theme line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {n.link && (
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wide flex items-center gap-0.5">
                        Ver
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2 block">notifications_off</span>
              <p className="text-xs text-gray-400 font-bold">No hay notificaciones</p>
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="w-full py-4 text-[11px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary/10 transition-all border-t border-gray-200 dark:border-gray-800 rounded-b-[24px]"
          >
            MARCAR TODAS COMO LEÍDAS
          </button>
        )}
      </div>,
      document.body
    );
  };

  // Mobile bottom sheet rendered via portal
  const renderMobileBottomSheet = () => {
    if (!isNotificationsOpen || !isMobile) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999]" ref={dropdownRef}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setIsNotificationsOpen(false)}
        />
        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 glass rounded-t-[30px] shadow-2xl animate-in slide-in-from-bottom duration-300 border-t-2 border-white/20 dark:border-white/10 max-h-[70vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">NOTIFICACIONES</h3>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="size-8 flex items-center justify-center rounded-full neu-btn text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto py-2">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-6 py-5 hover:bg-white/60 dark:hover:bg-black/30 cursor-pointer transition-colors active:bg-primary/10 ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 transition-theme">{n.title}</p>
                      {!n.read && <div className="size-2 bg-primary rounded-full mt-1.5 shrink-0"></div>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed font-semibold transition-theme line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest">
                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {n.link && (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                          Ver detalle
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-3 block">notifications_off</span>
                <p className="text-sm text-gray-400 font-bold">No hay notificaciones</p>
              </div>
            )}
          </div>
          {/* Footer */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="w-full py-5 text-xs font-black text-primary uppercase tracking-[0.3em] hover:bg-primary/10 transition-all border-t border-gray-200 dark:border-gray-800"
            >
              MARCAR TODAS COMO LEÍDAS
            </button>
          )}
          {/* Safe area padding for iOS */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
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

            {/* Notification Bell Button */}
            <button
              ref={bellButtonRef}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative size-10 sm:size-12 flex items-center justify-center rounded-full transition-theme shrink-0 ${isNotificationsOpen ? 'neu-inset text-primary' : 'neu-btn text-gray-500 dark:text-gray-400 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 size-2 sm:size-2.5 bg-primary rounded-full ring-3 sm:ring-4 ring-neu-bg-light dark:ring-neu-bg-dark transition-theme animate-pulse"></span>
              )}
            </button>
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

      {/* Render dropdowns via portal to escape header stacking context */}
      {renderDesktopDropdown()}
      {renderMobileBottomSheet()}
    </>
  );
};
