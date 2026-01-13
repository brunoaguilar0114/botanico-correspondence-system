
import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Correspondence, PackageStatus, EmailStatus, PackageType, User } from '../types';
import { NewCorrespondenceModal } from './NewCorrespondenceModal';
import { AttachmentManagerModal } from './AttachmentManagerModal';

interface AdminDashboardProps {
  currentUser: User | null;
  data: Correspondence[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNewRecord: (payload: any) => Promise<void>;
  onUpdateStatus: (id: string, status: PackageStatus) => Promise<void>;
  onUpdateRecord: (id: string, payload: any) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onResendNotification?: (id: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser, data, searchQuery, setSearchQuery, onNewRecord, onUpdateStatus, onUpdateRecord, onDeleteRecord, onRefresh, onResendNotification
}) => {
  const { showModal } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Correspondence | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [attachmentTargetItemId, setAttachmentTargetItemId] = useState<string | null>(null);

  const activeAttachmentItem = data.find(item => item.id === attachmentTargetItemId);

  const filteredData = data.filter(item => {
    if (activeTab === 'pending') {
      return item.status !== PackageStatus.DELIVERED;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 px-4">
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="flex items-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-gray-400 dark:text-gray-500 mb-1 md:mb-2 transition-theme">
            <span>Operaciones</span>
            <span className="material-symbols-outlined text-[12px] md:text-[14px] mx-2 md:mx-3 text-primary font-black transition-theme">arrow_right_alt</span>
            <span className="text-primary transition-theme">Recepción Botánico</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100 leading-none transition-theme">Correspondencia</h1>
          <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg font-bold transition-theme leading-tight">Control de entrada y digitalización.</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="neu-btn-primary h-14 md:h-16 w-full md:w-auto px-8 md:px-10 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-theme shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xl md:text-2xl">post_add</span>
          Registrar Entrada
        </button>
      </div>

      <NewCorrespondenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSubmit={async (payload) => {
          if (editingItem) {
            await onUpdateRecord(editingItem.id, payload);
          } else {
            await onNewRecord(payload);
          }
        }}
      />

      {activeAttachmentItem && (
        <AttachmentManagerModal
          item={activeAttachmentItem}
          onClose={() => setAttachmentTargetItemId(null)}
          onRefresh={onRefresh}
        />
      )}

      <div className="neu-surface rounded-[40px] md:rounded-[60px] p-6 md:p-12 relative overflow-hidden transition-theme">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 mb-10 md:mb-16">
          <div className="relative flex-1 w-full max-w-xl">
            <span className="absolute left-6 md:left-7 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined font-black">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 md:h-16 pl-14 md:pl-16 pr-8 rounded-full border-none neu-inset text-gray-700 dark:text-gray-300 text-sm font-bold focus:ring-0 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
              placeholder="Empresa, cliente o remitente..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="flex neu-inset rounded-full p-1.5 md:p-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 md:flex-none h-10 md:h-12 px-6 md:px-8 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'text-primary bg-white/50 dark:bg-black/20 shadow-sm' : 'text-gray-400 hover:text-primary'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 md:flex-none h-10 md:h-12 px-6 md:px-8 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'text-primary bg-white/50 dark:bg-black/20 shadow-sm' : 'text-gray-400 hover:text-primary'}`}
              >
                Pendientes
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 transition-theme">
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-6">Destinatario</th>
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Servicio</th>
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Estado</th>
                {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                  <>
                    <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Coste</th>
                    <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Notas Internas</th>
                  </>
                )}
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Notificado</th>
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Entregado Por</th>
                <th className="pb-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50 transition-theme">
              {filteredData.map((item) => (
                <tr key={item.id} className="group hover:bg-white/30 dark:hover:bg-black/10 transition-colors relative">
                  <td className="py-8 pl-6">
                    <div className="flex items-center gap-5">
                      <div className="size-14 neu-inset rounded-[20px] p-1.5 transition-theme">
                        <div className={`w-full h-full rounded-[14px] flex items-center justify-center text-sm font-black bg-primary/5 text-primary`}>
                          {item.recipient.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-gray-700 dark:text-gray-300 transition-theme">{item.recipient}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.sender}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8">
                    <div className="flex items-center gap-4">
                      <div className="neu-inset size-10 flex items-center justify-center rounded-[14px] text-primary/60 transition-theme">
                        <span className="material-symbols-outlined text-lg">
                          {item.type === PackageType.PACKAGE ? 'inventory_2' : 'mail'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.type}</span>
                    </div>
                  </td>
                  <td className="py-8 text-center">
                    <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-theme ${item.status === PackageStatus.SCANNED ? 'neu-inset text-primary border-primary/20 bg-primary/5' :
                      item.status === PackageStatus.DELIVERED ? 'neu-inset text-emerald-600 border-emerald-500/20 bg-emerald-500/5' :
                        'neu-inset text-yellow-600 border-yellow-500/20 bg-yellow-500/5'
                      }`}>
                      {item.status === PackageStatus.SCANNED ? 'Digitalizado' : item.status}
                      {item.attachment_path && (
                        <span className="material-symbols-outlined text-[14px] ml-1.5 text-primary">attach_file</span>
                      )}
                    </span>
                  </td>
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                    <>
                      <td className="py-8 text-center">
                        <span className="text-sm font-black text-gray-700 dark:text-gray-200">
                          {item.price ? `${item.price}€` : '-'}
                        </span>
                      </td>
                      <td className="py-8">
                        <span className="text-[10px] text-gray-400 font-bold truncate max-w-[150px] inline-block">
                          {item.internal_operational_notes || '-'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="py-8 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`material-symbols-outlined ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-300'}`}>
                        {item.email_status === EmailStatus.SENT ? 'verified' : 'mail_lock'}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-300'}`}>
                        {item.email_status === EmailStatus.SENT ? 'Notificado' : 'Pendiente'}
                      </span>
                    </div>
                  </td>
                  <td className="py-8 text-center">
                    {item.delivered_by_name ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.delivered_by_name}</span>
                        <span className="text-[8px] text-gray-400 font-bold">{item.date}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest">-</span>
                    )}
                  </td>
                  <td className="py-8 text-right pr-6">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="size-10 flex items-center justify-center rounded-full neu-btn text-blue-500 hover:scale-110 transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachmentTargetItemId(item.id);
                        }}
                        className={`size-10 flex items-center justify-center rounded-full neu-btn transition-all hover:scale-110 ${(item.attachments?.length || 0) > 0 ? 'text-blue-500' : 'text-primary'
                          }`}
                        title={(item.attachments?.length || 0) > 0 ? 'Gestionar Archivos' : 'Digitalizar'}
                      >
                        <span className="material-symbols-outlined text-base">
                          {(item.attachments?.length || 0) > 0 ? 'cloud_done' : 'document_scanner'}
                        </span>
                      </button>

                      {item.status !== PackageStatus.DELIVERED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(item.id, PackageStatus.DELIVERED);
                          }}
                          className="size-10 flex items-center justify-center rounded-full neu-btn text-emerald-500 hover:scale-110 transition-all"
                          title="Entregar"
                        >
                          <span className="material-symbols-outlined text-base">task_alt</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendNotification?.(item.id);
                        }}
                        className={`size-10 flex items-center justify-center rounded-full neu-btn transition-all hover:scale-110 ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-400'}`}
                        title="Reenviar Notificación"
                      >
                        <span className="material-symbols-outlined text-base">move_to_inbox</span>
                      </button>

                      {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showModal({
                              title: 'Eliminar Registro',
                              message: '¿Estás seguro de que deseas eliminar este registro de correspondencia? Esta acción no se puede deshacer.',
                              type: 'confirm',
                              confirmText: 'Eliminar',
                              onConfirm: () => onDeleteRecord(item.id)
                            });
                          }}
                          className="size-10 flex items-center justify-center rounded-full neu-btn text-red-400 hover:scale-110 transition-all"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-6">
          {filteredData.map((item) => (
            <div key={item.id} className="neu-surface rounded-[30px] p-6 flex flex-col gap-6 border border-gray-100/50 dark:border-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 neu-inset rounded-2xl p-1 shrink-0">
                    <div className="w-full h-full rounded-xl flex items-center justify-center text-xs font-black bg-primary/5 text-primary">
                      {item.recipient.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">{item.recipient}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.date} • {item.time}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-theme ${item.status === PackageStatus.SCANNED ? 'text-primary border-primary/20 bg-primary/5' :
                  item.status === PackageStatus.DELIVERED ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                    'text-yellow-600 border-yellow-500/20 bg-yellow-500/5'
                  }`}>
                  {item.status}
                </span>
              </div>

              <div className="flex flex-col gap-3 neu-inset p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Remitente</span>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{item.sender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</span>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{item.type}</span>
                </div>
                {item.delivered_by_name && (
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entregado Por</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">{item.delivered_by_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className={`size-8 rounded-full flex items-center justify-center neu-inset ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-300'}`}>
                    <span className="material-symbols-outlined text-sm">{item.email_status === EmailStatus.SENT ? 'verified' : 'mail_lock'}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-400'}`}>
                    {item.email_status === EmailStatus.SENT ? 'Notificado' : 'Pendiente'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onResendNotification?.(item.id)}
                    className={`size-10 flex items-center justify-center rounded-full neu-btn ${item.email_status === EmailStatus.SENT ? 'text-primary' : 'text-gray-400'}`}
                    title="Reenviar"
                  >
                    <span className="material-symbols-outlined text-base">move_to_inbox</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="size-10 flex items-center justify-center rounded-full neu-btn text-blue-500"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => setAttachmentTargetItemId(item.id)}
                    className={`size-10 flex items-center justify-center rounded-full neu-btn ${(item.attachments?.length || 0) > 0 ? 'text-blue-500' : 'text-primary'}`}
                  >
                    <span className="material-symbols-outlined text-base">{(item.attachments?.length || 0) > 0 ? 'cloud_done' : 'document_scanner'}</span>
                  </button>
                  {item.status !== PackageStatus.DELIVERED && (
                    <button
                      onClick={() => onUpdateStatus(item.id, PackageStatus.DELIVERED)}
                      className="size-10 flex items-center justify-center rounded-full neu-btn text-emerald-500"
                    >
                      <span className="material-symbols-outlined text-base">task_alt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">search_off</span>
              <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Sin resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
