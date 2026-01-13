
import React from 'react';
import { Correspondence, PackageStatus, EmailStatus } from '../types';
import { correspondenceService } from '../services/supabase';

interface CorrespondenceCardProps {
  item: Correspondence;
}

export const CorrespondenceCard: React.FC<CorrespondenceCardProps> = ({ item }) => {
  const isScanned = item.status === PackageStatus.SCANNED || !!item.attachment_path || (item.attachments && item.attachments.length > 0);
  const isDelivered = item.status === PackageStatus.DELIVERED;

  const handleDownload = async () => {
    if (item.attachment_path) {
      const url = await correspondenceService.getAttachmentUrl(item.attachment_path);
      if (url) {
        window.open(url, '_blank');
      }
    } else if (item.attachment_url) {
      window.open(item.attachment_url, '_blank');
    }
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-8 p-8 rounded-[40px] transition-theme ${!isDelivered
        ? 'neu-surface hover:scale-[1.01]'
        : 'neu-surface opacity-60 grayscale-[0.2]'
        }`}
    >
      <div className={`shrink-0 size-20 flex items-center justify-center rounded-[30px] transition-theme ${!isDelivered ? 'neu-inset text-primary' : 'neu-inset text-gray-400 dark:text-gray-600'
        }`}>
        <span className="material-symbols-outlined text-[36px]">
          {isScanned ? 'picture_as_pdf' : (item.type === 'Paquete' ? 'package_2' : 'mail')}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-2.5">
          <h3 className="text-xl font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight transition-theme">
            {item.type} {isScanned && <span className="text-primary text-xs font-black ml-2 underline decoration-2 underline-offset-4">DIGITAL</span>}
          </h3>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-theme ${isScanned ? 'bg-primary/10 text-primary' :
            isDelivered ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' :
              'bg-yellow-500/10 text-yellow-600'
            }`}>
            {item.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-bold text-gray-400 dark:text-gray-500 transition-theme">
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
            Recepción: {item.date}
          </span>
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary">business</span>
            Remitente: {item.sender}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-6 mt-8 sm:mt-0">
        {isScanned && item.attachments && item.attachments.length > 0 ? (
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right mb-1">Documentos ({item.attachments.length})</span>
            {item.attachments.map((att) => (
              <button
                key={att.id}
                onClick={async () => {
                  const url = await correspondenceService.getAttachmentUrl(att.file_path);
                  if (url) window.open(url, '_blank');
                }}
                className="neu-btn px-6 py-2.5 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-between gap-4 hover:bg-primary hover:text-white transition-theme group/btn w-full sm:min-w-[200px]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">
                    {att.file_name.split('.').pop()?.toLowerCase() === 'pdf' ? 'picture_as_pdf' :
                      ['jpg', 'jpeg', 'png'].includes(att.file_name.split('.').pop()?.toLowerCase() || '') ? 'image' : 'description'}
                  </span>
                  <span className="truncate max-w-[120px]">{att.file_name}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] opacity-40 group-hover/btn:opacity-100 transition-opacity">download</span>
              </button>
            ))}
          </div>
        ) : isScanned && (item.attachment_path || item.attachment_url) ? (
          <button
            onClick={handleDownload}
            className="neu-btn px-7 py-3 rounded-full text-primary text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-primary hover:text-white transition-theme group/btn"
          >
            Ver Digital
            <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-y-[-2px] transition-transform">
              {item.attachment_path ? 'download' : 'visibility'}
            </span>
          </button>
        ) : !isDelivered && (
          <div className="px-6 py-2 rounded-full bg-primary/5 border border-primary/10">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Disponible para recogida</span>
          </div>
        )}
      </div>
    </div>
  );
};
