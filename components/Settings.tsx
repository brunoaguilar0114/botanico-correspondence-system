import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService, authService } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../services/client';

interface SettingsProps {
  onBack?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    notificationEmail: '',
    emailNotifications: true,
    weeklyReport: false,
    alertSounds: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setFormData({
          fullName: data.full_name || '',
          phone: data.phone_number || '',
          company: data.company || '',
          notificationEmail: data.notification_email || '',
          emailNotifications: data.email_notifications ?? true,
          weeklyReport: data.weekly_report ?? false,
          alertSounds: data.alert_sounds ?? true
        });
      }
    };
    fetchFullProfile();
  }, [user]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await userService.updateProfile(user.id, {
      full_name: formData.fullName,
      phone_number: formData.phone,
      notification_email: formData.notificationEmail,
    });

    if (error) {
      showToast('Error updating profile: ' + error.message, 'error');
    } else {
      showToast('Perfil actualizado correctamente', 'success');
    }
    setLoading(false);
  };

  const handleTogglePreference = async (field: 'email_notifications' | 'weekly_report' | 'alert_sounds', currentVal: boolean) => {
    if (!user) return;

    // Optimistic update
    const fieldMap = {
      email_notifications: 'emailNotifications',
      weekly_report: 'weeklyReport',
      alert_sounds: 'alertSounds'
    } as const;

    setFormData(prev => ({ ...prev, [fieldMap[field]]: !currentVal }));

    const { error } = await userService.updateProfile(user.id, {
      [field]: !currentVal
    });

    if (error) {
      showToast('Error al guardar preferencia', 'error');
      // Rollback
      setFormData(prev => ({ ...prev, [fieldMap[field]]: currentVal }));
    } else {
      showToast('Preferencia actualizada', 'success');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    setLoading(true);
    const file = e.target.files[0];
    const { url, error } = await userService.uploadAvatar(user.id, file);

    if (error) {
      showToast('Error uploading avatar: ' + error.message, 'error');
    } else if (url) {
      setAvatarUrl(url);
      await userService.updateProfile(user.id, { avatar_url: url });
      // Refresh user data to update avatar across the entire app
      await refreshUser();
      showToast('Avatar actualizado correctamente', 'success');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast('Las contraseñas no coinciden', 'error');
    }

    if (passwordData.newPassword.length < 6) {
      return showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    }

    setIsChangingPass(true);

    // 1. Verify current password by signing in again
    const { success, error: verifyError } = await authService.verifyCurrentPassword(user.email, passwordData.currentPassword);

    if (!success) {
      setIsChangingPass(false);
      return showToast('La contraseña actual es incorrecta', 'error');
    }

    // 2. Update to new password
    const { error: updateError } = await authService.updatePassword(passwordData.newPassword);

    if (updateError) {
      showToast('Error al actualizar contraseña: ' + updateError, 'error');
    } else {
      showToast('Contraseña actualizada correctamente', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }

    setIsChangingPass(false);
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-6 px-4">
        {onBack && (
          <button onClick={onBack} className="size-14 neu-btn rounded-full flex items-center justify-center text-gray-500 hover:text-primary transition-theme">
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-800 dark:text-gray-100 transition-theme">Mi Perfil</h1>
          <p className="text-gray-400 dark:text-gray-500 text-lg font-bold transition-theme">Gestiona tu identidad y preferencias.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="neu-surface rounded-[60px] p-12 transition-theme relative overflow-hidden">
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="relative group">
              <div className={`size-32 rounded-[40px] neu-inset p-2 transition-transform ${user?.role === 'recepcionista' ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                onClick={() => user?.role !== 'recepcionista' && fileInputRef.current?.click()}>
                {avatarUrl || user?.avatar ? (
                  <img src={avatarUrl || user?.avatar} alt="Profile" className="w-full h-full object-cover rounded-[32px]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-5xl">person</span>
                  </div>
                )}
                {user?.role !== 'recepcionista' && (
                  <div className="absolute inset-0 bg-black/50 rounded-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" disabled={user?.role === 'recepcionista'} />
            </div>

            <div className="text-center">
              <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-theme mb-2 ${user?.role === 'super_admin' ? 'text-primary border-primary/20 bg-primary/5' :
                user?.role === 'admin' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                  user?.role === 'recepcionista' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
                    'text-gray-400 border-gray-100'
                }`}>
                {user?.role?.replace('_', ' ')}
              </span>
              <p className="text-gray-400 text-xs font-bold">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre Completo</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme disabled:opacity-50"
                disabled={user?.role === 'recepcionista'}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Teléfono</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme disabled:opacity-50"
                disabled={user?.role === 'recepcionista'}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email para Notificaciones</label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={e => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme"
                placeholder="email@notificaciones.com"
              />
              <p className="text-[10px] text-gray-400 font-bold ml-4">Este correo recibirá los avisos de ingreso de correspondencia.</p>
            </div>

            <div className="pt-4">
              {user?.role !== 'recepcionista' && (
                <button type="submit" disabled={loading} className="w-full h-16 neu-btn-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  {loading ? 'Guardando...' : 'Actualizar Perfil'}
                </button>
              )}
              {user?.role === 'recepcionista' && (
                <p className="text-center text-xs text-gray-400 font-bold italic mt-4">
                  * La información de perfil de empleados es gestionada por administración.
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="neu-surface rounded-[60px] p-12 transition-theme">
          <h2 className="text-xl font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest mb-10">Preferencias</h2>
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 neu-inset rounded-[30px] transition-theme">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-gray-700 dark:text-gray-300">Notificaciones Email</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Recibir avisos de nuevos paquetes</span>
              </div>
              <button
                onClick={() => handleTogglePreference('email_notifications', formData.emailNotifications)}
                className={`size-12 neu-btn rounded-xl flex items-center justify-center transition-all ${formData.emailNotifications ? 'text-emerald-500' : 'text-gray-300'}`}
              >
                <span className="material-symbols-outlined">{formData.emailNotifications ? 'toggle_on' : 'toggle_off'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-6 neu-inset rounded-[30px] transition-theme">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-gray-700 dark:text-gray-300">Informe Semanal</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Resumen de actividad dominical</span>
              </div>
              <button
                onClick={() => handleTogglePreference('weekly_report', formData.weeklyReport)}
                className={`size-12 neu-btn rounded-xl flex items-center justify-center transition-all ${formData.weeklyReport ? 'text-emerald-500' : 'text-gray-300'}`}
              >
                <span className="material-symbols-outlined">{formData.weeklyReport ? 'toggle_on' : 'toggle_off'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-6 neu-inset rounded-[30px] transition-theme">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-gray-700 dark:text-gray-300">Sonidos de Alerta</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Audio al registrar entrada</span>
              </div>
              <button
                onClick={() => handleTogglePreference('alert_sounds', formData.alertSounds)}
                className={`size-12 neu-btn rounded-xl flex items-center justify-center transition-all ${formData.alertSounds ? 'text-emerald-500' : 'text-gray-300'}`}
              >
                <span className="material-symbols-outlined">{formData.alertSounds ? 'toggle_on' : 'toggle_off'}</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-bold text-center pt-8">
              ID de Usuario: <span className="font-mono opacity-50">{user?.id}</span>
            </p>

            <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => signOut()}
                className="w-full h-16 neu-inset rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-theme flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">logout</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="neu-surface rounded-[60px] p-12 transition-theme">
          <h2 className="text-xl font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest mb-10">Seguridad</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Contraseña Actual</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme"
                  placeholder="Mín. 6 caracteres"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirmar Nueva</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="h-14 neu-inset border-none rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 transition-theme"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full h-16 neu-btn-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
            >
              {isChangingPass ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};