
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

export const VADAVO_LOGO = (
  <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
  </svg>
);
