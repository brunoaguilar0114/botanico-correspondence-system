
import React, { useState, useEffect } from 'react';
import { PackageType, PackageStatus } from '../types';
import { correspondenceService } from '../services/supabase';

interface NewCorrespondenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export const NewCorrespondenceModal: React.FC<NewCorrespondenceModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    recipient: '',
    recipient_id: undefined as string | undefined,
    recipient_email: '',
    sender: '',
    type: PackageType.PACKAGE,
    tracking_number: '',
    price: '',
    supplier_info: '',
    internal_operational_notes: '',
    status: PackageStatus.RECEIVED as PackageStatus,
    shouldNotify: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        recipient: initialData.recipient || '',
        recipient_id: initialData.recipient_id,
        recipient_email: initialData.recipient_email || '',
        sender: initialData.sender || '',
        type: initialData.type || PackageType.PACKAGE,
        tracking_number: initialData.tracking_number || '',
        price: initialData.price?.toString() || '',
        supplier_info: initialData.supplier_info || '',
        internal_operational_notes: initialData.internal_operational_notes || '',
        status: initialData.status || PackageStatus.RECEIVED,
        shouldNotify: false // Default to false on edit
      });
    } else {
      setFormData({
        recipient: '',
        recipient_id: undefined,
        recipient_email: '',
        sender: '',
        type: PackageType.PACKAGE,
        tracking_number: '',
        price: '',
        supplier_info: '',
        internal_operational_notes: '',
        status: PackageStatus.RECEIVED,
        shouldNotify: true // Default to true on new
      });
    }
  }, [initialData, isOpen]);
  const [activeField, setActiveField] = useState<'recipient' | 'email' | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const value = activeField === 'recipient' ? formData.recipient : formData.recipient_email;
      if (value && value.length >= 2) {
        const results = await correspondenceService.searchProfiles(value);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.recipient, formData.recipient_email, activeField]);

  const handleSelectSuggestion = (profile: any) => {
    setFormData({
      ...formData,
      recipient: profile.full_name,
      recipient_id: profile.id,
      recipient_email: profile.email || ''
    });
    setSuggestions([]);
    setActiveField(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center glass px-4 py-8 animate-in fade-in duration-300">
      <div className="neu-surface w-full max-w-[500px] max-h-full rounded-[40px] md:rounded-[60px] p-6 md:p-10 flex flex-col animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl md:text-2xl font-black text-gray-700 dark:text-gray-200">{initialData ? 'Editar Registro' : 'Nuevo Registro'}</h2>
            <span className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-widest">Botánico Coworking</span>
          </div>
          <button onClick={onClose} className="size-10 md:size-12 rounded-full neu-btn text-gray-400 hover:text-primary flex items-center justify-center transition-all shrink-0">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 py-2">
            <div className="space-y-2 relative">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Cliente / Empresa</label>
              <input
                required
                autoComplete="off"
                className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all"
                placeholder="Nombre del destinatario"
                value={formData.recipient}
                onChange={e => {
                  setFormData({ ...formData, recipient: e.target.value });
                  setActiveField('recipient');
                }}
                onFocus={() => setActiveField('recipient')}
              />
              {suggestions.length > 0 && activeField === 'recipient' && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 neu-surface rounded-[25px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full text-left p-3 rounded-xl hover:bg-primary/5 transition-colors group flex items-center justify-between"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate">{p.full_name}</span>
                          <span className="text-[9px] text-gray-400 font-bold truncate">{p.email}</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors text-lg">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 relative">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Email de Notificación</label>
              <input
                required
                type="email"
                autoComplete="off"
                className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all"
                placeholder="cliente@email.com"
                value={formData.recipient_email}
                onChange={e => {
                  setFormData({ ...formData, recipient_email: e.target.value });
                  setActiveField('recipient_email');
                }}
                onFocus={() => setActiveField('recipient_email')}
              />
              {suggestions.length > 0 && activeField === 'recipient_email' && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 neu-surface rounded-[25px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(p)}
                        className="w-full text-left p-3 rounded-xl hover:bg-primary/5 transition-colors group flex items-center justify-between"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-700 dark:text-gray-200 truncate">{p.full_name}</span>
                          <span className="text-[9px] text-gray-400 font-bold truncate">{p.email}</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors text-lg">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Remitente</label>
                <input
                  required
                  className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all"
                  placeholder="Amazon..."
                  value={formData.sender}
                  onChange={e => setFormData({ ...formData, sender: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Tipo</label>
                <div className="relative">
                  <select
                    className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 appearance-none bg-transparent"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as PackageType })}
                  >
                    {Object.values(PackageType).map(t => (
                      <option key={t} value={t} className="dark:bg-neu-bg-dark">{t}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Tracking / Ref</label>
                <input
                  className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all"
                  placeholder="1Z2..."
                  value={formData.tracking_number}
                  onChange={e => setFormData({ ...formData, tracking_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Coste (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Notas Operativas</label>
              <textarea
                rows={2}
                className="w-full rounded-[25px] neu-inset border-none p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 transition-all resize-none"
                placeholder="Notas internas..."
                value={formData.internal_operational_notes}
                onChange={e => setFormData({ ...formData, internal_operational_notes: e.target.value })}
              />
            </div>

            {initialData && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-5">Estado Manual (Override)</label>
                <div className="relative">
                  <select
                    className="w-full h-12 rounded-full neu-inset border-none px-6 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 appearance-none bg-transparent"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as PackageStatus })}
                  >
                    {Object.values(PackageStatus).map(s => (
                      <option key={s} value={s} className="dark:bg-neu-bg-dark">{s}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                </div>
              </div>
            )}

            <div className="pt-4 px-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, shouldNotify: !formData.shouldNotify })}
                className="w-full flex items-center justify-between p-4 neu-surface rounded-2xl hover:bg-gray-50/50 dark:hover:bg-black/10 transition-all border border-transparent hover:border-primary/20"
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center transition-all ${formData.shouldNotify ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'neu-inset text-gray-400'
                    }`}>
                    <span className="material-symbols-outlined text-xl">
                      {formData.shouldNotify ? 'notifications_active' : 'notifications_off'}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Notificar por Email</span>
                    <span className="text-[9px] font-bold text-gray-400">Enviar aviso al cliente al guardar</span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${formData.shouldNotify ? 'bg-primary' : 'neu-inset'
                  }`}>
                  <div className={`size-4 rounded-full bg-white shadow-sm transition-all transform ${formData.shouldNotify ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                </div>
              </button>
            </div>
          </div>

          <div className="pt-6 shrink-0">
            <button
              disabled={loading}
              type="submit"
              className="w-full h-14 neu-btn-primary rounded-full font-black uppercase tracking-[0.3em] text-[10px] md:text-[11px] flex items-center justify-center gap-3 md:gap-4 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">{initialData ? 'save' : 'send'}</span>
                  {initialData ? 'Guardar Cambios' : 'Registrar y Notificar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
