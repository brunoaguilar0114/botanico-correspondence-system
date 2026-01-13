
import React, { useState } from 'react';
import { VADAVO_LOGO } from '../constants';
import { authService } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface ResetPasswordProps {
    onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
    const { showToast } = useNotifications();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres');
        }

        setLoading(true);
        const { error: updateError } = await authService.updatePassword(password);

        if (updateError) {
            setError(updateError);
            showToast('Error al actualizar contraseña', 'error');
        } else {
            showToast('Contraseña restablecida correctamente', 'success');
            onComplete();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-neu-bg transition-theme p-6">
            <div className="w-full max-w-[440px] neu-surface rounded-[50px] p-12 relative overflow-hidden transition-theme animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="size-16 p-3 neu-btn rounded-2xl text-primary mb-4 flex items-center justify-center">
                        {VADAVO_LOGO}
                    </div>
                    <h1 className="text-xl font-black text-gray-700 dark:text-gray-100 uppercase tracking-tight">Nueva Contraseña</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Configura tu acceso de forma segura</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-400 ml-4">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-6 focus:ring-0 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-400 ml-4">Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-12 neu-inset border-none rounded-full text-gray-600 dark:text-gray-300 px-6 focus:ring-0 transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 neu-btn-primary rounded-full text-lg font-medium tracking-wide mt-6 transition-theme disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Restablecer Acceso'}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Botánico Coworking Security</p>
                </div>
            </div>
        </div>
    );
};
