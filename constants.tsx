
import React from 'react';
import { Correspondence, PackageStatus, PackageType, EmailStatus } from './types';

export const ADMIN_MOCK_DATA: Correspondence[] = [
  {
    id: '1',
    recipient: 'Juan Pérez',
    recipientEmail: 'juan.perez@vadavo.com',
    type: PackageType.PACKAGE,
    date: '24 Oct, 2023',
    time: '09:30 AM',
    status: PackageStatus.RECEIVED,
    emailStatus: EmailStatus.SENT,
    sender: 'Amazon',
    trackingNumber: 'AZ-928374'
  },
  {
    id: '2',
    recipient: 'María García',
    recipientEmail: 'maria.garcia@vadavo.com',
    type: PackageType.LETTER,
    date: '24 Oct, 2023',
    time: '10:15 AM',
    status: PackageStatus.SCANNED,
    emailStatus: EmailStatus.SENT,
    sender: 'Agencia Tributaria',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: '3',
    recipient: 'Carlos López',
    recipientEmail: 'carlos.lopez@vadavo.com',
    recipientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    type: PackageType.PACKAGE,
    date: '23 Oct, 2023',
    time: '04:45 PM',
    status: PackageStatus.DELIVERED,
    emailStatus: EmailStatus.SENT,
    sender: 'UPS'
  },
  {
    id: '4',
    recipient: 'Ana Ruiz',
    recipientEmail: 'ana.ruiz@vadavo.com',
    type: PackageType.CERTIFIED,
    date: '23 Oct, 2023',
    time: '02:20 PM',
    status: PackageStatus.NOTIFIED,
    emailStatus: EmailStatus.FAILED,
    sender: 'Ayuntamiento Valencia'
  },
  {
    id: '5',
    recipient: 'Luis Torres',
    recipientEmail: 'luis.torres@vadavo.com',
    recipientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    type: PackageType.PACKAGE,
    date: '22 Oct, 2023',
    time: '11:00 AM',
    status: PackageStatus.DELIVERED,
    emailStatus: EmailStatus.NA,
    sender: 'Inditex'
  }
];

// Logo completo (expandido)
export const VADAVO_LOGO = (
  <div className="flex flex-col">
    <h1 className="text-gray-800 dark:text-gray-100 text-xl font-black leading-none tracking-tight transition-theme">
      Botánico Coworking
    </h1>
    <p className="text-primary text-[9px] font-black uppercase tracking-[0.3em] mt-1.5">
      CORRESPONDENCIA
    </p>
  </div>
);
