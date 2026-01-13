
export enum PackageStatus {
  RECEIVED = 'Recibido',
  NOTIFIED = 'Notificado',
  SCANNED = 'Escaneado',
  DELIVERED = 'Entregado'
}

export enum EmailStatus {
  SENT = 'Enviado',
  FAILED = 'Fallido',
  PENDING = 'Pendiente',
  NA = 'N/A'
}

export enum PackageType {
  PACKAGE = 'Paquete',
  LETTER = 'Carta',
  CERTIFIED = 'Certificado'
}

export type UserRole = 'super_admin' | 'admin' | 'recepcionista' | 'cliente';

export interface Attachment {
  id: string;
  correspondence_id: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface Correspondence {
  id: string;
  recipient: string;
  recipient_id?: string;
  recipient_email: string;
  recipient_avatar?: string;
  type: PackageType;
  date: string;
  time: string;
  status: PackageStatus;
  email_status: EmailStatus;
  sender: string;
  attachment_url?: string; // Keep for legacy if needed
  attachment_path?: string;
  attachment_name?: string;
  attachments?: Attachment[];
  tracking_number?: string;
  // Sensitive RBAC fields
  price?: number;
  supplier_info?: string;
  internal_operational_notes?: string;
  delivered_by?: string;
  delivered_by_name?: string;
  delivered_at?: string;
  digitized_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  notification_email?: string;
  phone_number?: string;
  created_by?: string;
  status?: 'active' | 'inactive';
  internal_notes?: string;
}
