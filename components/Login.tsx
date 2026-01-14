import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/client';
import { authService } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Fetch profile for role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      onLogin({
        id: authData.user.id,
        name: profileData?.full_name || authData.user.email?.split('@')[0] || 'Usuario',
        email: authData.user.email!,
        role: (profileData?.plan === 'admin' || authData.user.email === 'admin@vadavo.com') ? 'admin' : 'client'
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await authService.sendPasswordResetEmail(email.trim());

    if (resetError) {
      setError(resetError);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex transition-theme">
      {/* Columna izquierda - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-neu-bg transition-theme p-6 lg:p-8">
        <div className="w-full max-w-[440px] neu-surface rounded-[40px] lg:rounded-[50px] p-8 lg:p-10 relative overflow-hidden transition-theme">
          <div className="flex flex-col items-center mb-6 lg:mb-8">
            <div className="size-12 lg:size-14 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gray-900 dark:bg-gray-800 mb-3 lg:mb-4 flex items-center justify-center transition-theme">
              <span className="text-white text-2xl lg:text-3xl font-black">B</span>
            </div>
            <h1 className="text-gray-700 dark:text-gray-100 text-xl lg:text-2xl font-black tracking-tight transition-theme">Botánico Coworking</h1>
            <p className="text-[9px] lg:text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1.5 lg:mt-2">Correspondencia</p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
              )}
              <div className="space-y-2.5 lg:space-y-3">
                <label className="block text-xs lg:text-sm font-medium text-gray-400 ml-4">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vadavo.com o tu email"
                  className="w-full h-11 lg:h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 lg:px-6 focus:ring-0 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 text-sm"
                  required
                />
              </div>

              <div className="space-y-2.5 lg:space-y-3">
                <label className="block text-xs lg:text-sm font-medium text-gray-400 ml-4">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 lg:h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-5 lg:px-6 focus:ring-0 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 lg:h-14 neu-btn-dark rounded-full text-base lg:text-lg font-medium tracking-wide mt-4 lg:mt-6 transition-theme disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Entrar'}
              </button>

              <div className="text-center mt-3 lg:mt-4">
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(null); }}
                  className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 lg:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {resetSent ? (
              <div className="text-center py-8 flex flex-col items-center gap-6">
                <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined text-4xl">mail</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-gray-700 dark:text-gray-100 uppercase tracking-tight">Email Enviado</h2>
                  <p className="text-xs font-bold text-gray-400 px-4">
                    Hemos enviado un enlace de recuperación a <span className="text-primary">{email}</span>. Revisa tu bandeja de entrada.
                  </p>
                </div>
                <button
                  onClick={() => { setMode('login'); setResetSent(false); }}
                  className="w-full h-14 neu-btn rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all"
                >
                  Volver al Inicio
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-black text-gray-700 dark:text-gray-100 uppercase tracking-tight">Recuperar Acceso</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Enviaremos un enlace a tu correo</p>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-400 ml-4">Tu Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@email.com"
                    className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-6 focus:ring-0 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 neu-btn-primary rounded-full text-lg font-medium tracking-wide transition-theme disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Enviar Enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="w-full h-14 neu-btn rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Acceso a Botánico Coworking</p>
        </div>
      </div>
    </div>
  );
};
