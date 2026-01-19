
import { Correspondence, PackageStatus, EmailStatus, PackageType, StorageConfig, StorageOverview } from '../types';
import { supabase } from './client';

export const correspondenceService = {
  async getAll(): Promise<Correspondence[]> {
    const { data, error } = await supabase
      .from('correspondence')
      .select('*, deliverer:profiles!delivered_by(full_name), attachments:correspondence_attachments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all correspondence:', error);
      return [];
    }

    // Map joined data to our type
    return (data || []).map(item => ({
      ...item,
      delivered_by_name: (item as any).deliverer?.full_name
    })) as Correspondence[];
  },

  async getByUserId(email: string): Promise<Correspondence[]> {
    const { data, error } = await supabase
      .from('correspondence')
      .select('*, deliverer:profiles!delivered_by(full_name), attachments:correspondence_attachments(*)')
      .eq('recipient_email', email)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching correspondence:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      delivered_by_name: (item as any).deliverer?.full_name
    })) as Correspondence[];
  },

  async create(payload: {
    recipient: string;
    recipient_id?: string;
    recipient_email: string; // Updated to match frontend
    email?: string; // Kept for backward compatibility if needed
    type: PackageType;
    sender: string
  }): Promise<{ data: Correspondence | null; error: string | null }> {
    // 1. Check if profile exists (lookup logic handled globally now, but ensure validity)
    // 2. Insert correspondence
    const { data, error } = await supabase
      .from('correspondence')
      .insert([{
        recipient: payload.recipient,
        recipient_id: payload.recipient_id,
        recipient_email: payload.recipient_email || payload.email, // Handle both
        type: payload.type,
        sender: payload.sender,
        status: PackageStatus.RECEIVED,
        email_status: EmailStatus.PENDING,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }])
      .select()
      .single();

    // Audit logging is now handled by database trigger (correspondence_audit_insert)
    // Keeping this commented for reference, but trigger ensures server-side enforcement
    // if (!error && data) {
    //   await auditService.logEvent({
    //     eventType: 'CREATE',
    //     resourceType: 'CORRESPONDENCE',
    //     resourceId: data.id,
    //     details: `Correspondencia creada para ${payload.recipient}`,
    //     userName: payload.sender
    //   });
    // }

    return { data, error: error?.message || null };
  },

  async updateStatus(id: string, status: PackageStatus): Promise<void> {
    const { error } = await supabase
      .from('correspondence')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    }
    // Audit logging is now handled by database trigger (correspondence_audit_update)
    // else {
    //   await auditService.logEvent({
    //     eventType: 'STATUS_CHANGE',
    //     resourceType: 'CORRESPONDENCE',
    //     resourceId: id,
    //     details: `Estado actualizado a ${status}`
    //   });
    // }
  },

  async updateStatusWithTracking(id: string, updates: {
    status: PackageStatus;
    delivered_by?: string;
    delivered_at?: string;
    digitized_at?: string;
    attachment_path?: string;
    attachment_name?: string;
  }): Promise<void> {
    const payload: any = { status: updates.status };
    if (updates.delivered_by) payload.delivered_by = updates.delivered_by;
    if (updates.delivered_at) payload.delivered_at = updates.delivered_at;
    if (updates.digitized_at) payload.digitized_at = updates.digitized_at;
    if (updates.attachment_path) payload.attachment_path = updates.attachment_path;
    if (updates.attachment_name) payload.attachment_name = updates.attachment_name;

    const { error } = await supabase
      .from('correspondence')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating status with tracking:', error);
    }
    // Audit logging is now handled by database trigger (correspondence_audit_update)
    // else {
    //   await auditService.logEvent({
    //     eventType: 'STATUS_CHANGE',
    //     resourceType: 'CORRESPONDENCE',
    //     resourceId: id,
    //     details: `Estado actualizado con seguimiento: ${updates.status}`
    //   });
    // }
  },

  async update(id: string, updates: Partial<Correspondence>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('correspondence')
      .update({
        recipient: updates.recipient,
        recipient_id: updates.recipient_id,
        recipient_email: updates.recipient_email,
        type: updates.type,
        sender: updates.sender,
        status: updates.status,
        tracking_number: updates.tracking_number,
        price: updates.price,
        supplier_info: updates.supplier_info,
        internal_operational_notes: updates.internal_operational_notes
      })
      .eq('id', id);

    // Audit logging is now handled by database trigger (correspondence_audit_update)
    // if (!error) {
    //   await auditService.logEvent({
    //     eventType: 'UPDATE',
    //     resourceType: 'CORRESPONDENCE',
    //     resourceId: id,
    //     details: 'Registro de correspondencia actualizado'
    //   });
    // }

    return { error: error?.message || null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    // Fetch item details first for the log
    const { data: item } = await supabase
      .from('correspondence')
      .select('recipient')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('correspondence')
      .delete()
      .eq('id', id);

    // Audit logging is now handled by database trigger (correspondence_audit_delete)
    // if (!error) {
    //   await auditService.logEvent({
    //     eventType: 'DELETE',
    //     resourceType: 'CORRESPONDENCE',
    //     resourceId: id,
    //     details: `Registro eliminado (Destinatario: ${item?.recipient || 'Desconocido'})`
    //   });
    // }

    return { error: error?.message || null };
  },

  async searchProfiles(query: string): Promise<{ id: string; full_name: string; email: string }[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);

    return data || [];
  },

  async uploadAttachment(correspondenceId: string, file: File): Promise<{ path: string | null; error: string | null }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${correspondenceId}/${Math.random()}.${fileExt}`;
    const filePath = `digitized/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('digitized-files')
      .upload(filePath, file);

    if (uploadError) return { path: null, error: uploadError.message };

    // Insert into DB
    const { error: dbError } = await supabase
      .from('correspondence_attachments')
      .insert({
        correspondence_id: correspondenceId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size
      });

    if (dbError) {
      console.error('Error linking attachment in DB:', dbError);
      return { path: filePath, error: dbError.message };
    }

    return { path: filePath, error: null };
  },

  async deleteAttachment(attachmentId: string, filePath: string): Promise<{ error: string | null }> {
    // 1. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('digitized-files')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // 2. Delete from DB (even if storage fails, we should try to cleanup DB or vice versa)
    const { error: dbError } = await supabase
      .from('correspondence_attachments')
      .delete()
      .eq('id', attachmentId);

    return { error: dbError?.message || null };
  },

  async getAttachmentUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('digitized-files')
      .createSignedUrl(path, 3600); // 1 hour expiration

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  },

  async getUserHistory(userId: string, email: string) {
    // Fetch where user is recipient OR deliverer
    const { data, error } = await supabase
      .from('correspondence')
      .select('*, deliverer:profiles!delivered_by(full_name)')
      .or(`recipient_id.eq.${userId},delivered_by.eq.${userId},recipient_email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user history:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      delivered_by_name: (item as any).deliverer?.full_name
    })) as Correspondence[];
  },

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Monthly Inbound
    const { count: monthlyInbound } = await supabase
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 2. Pending Pickup (everything NOT delivered)
    const { count: pendingPickup } = await supabase
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .neq('status', PackageStatus.DELIVERED);

    // 3. Total Digitized (records with at least one attachment)
    const { data: digitizedData } = await supabase
      .from('correspondence_attachments')
      .select('correspondence_id');
    const uniqueDigitizedIds = new Set(digitizedData?.map(d => d.correspondence_id));
    const totalDigitized = uniqueDigitizedIds.size;

    // 4. Weekly Activity (last 7 days)
    const { data: weeklyData } = await supabase
      .from('correspondence')
      .select('created_at')
      .gte('created_at', sevenDaysAgo);

    const activityByDay = Array(7).fill(0);
    weeklyData?.forEach(item => {
      const createdDate = new Date(item.created_at);
      const diffTime = now.getTime() - createdDate.getTime();
      const dayIndex = Math.floor(diffTime / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        activityByDay[6 - dayIndex]++;
      }
    });

    // 5. Notification Efficiency (SENT / (SENT + FAILED) * 100)
    const { count: sentCount } = await supabase
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .eq('email_status', EmailStatus.SENT);

    const { count: failedCount } = await supabase
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .eq('email_status', EmailStatus.FAILED);

    const sent = sentCount || 0;
    const failed = failedCount || 0;
    const notificationEfficiency = sent + failed > 0
      ? Math.round((sent / (sent + failed)) * 100)
      : 100;

    // 6. Storage stats by type (packages vs letters)
    const [
      { count: packagesUsed },
      { count: lettersUsed },
      storageConfigResult
    ] = await Promise.all([
      // Packages pending (type = 'Paquete' AND status != 'Entregado')
      supabase
        .from('correspondence')
        .select('*', { count: 'exact', head: true })
        .eq('type', PackageType.PACKAGE)
        .neq('status', PackageStatus.DELIVERED),
      // Letters pending (type IN ('Carta', 'Certificado') AND status != 'Entregado')
      supabase
        .from('correspondence')
        .select('*', { count: 'exact', head: true })
        .in('type', [PackageType.LETTER, PackageType.CERTIFIED])
        .neq('status', PackageStatus.DELIVERED),
      // Storage configuration
      supabase
        .from('storage_config')
        .select('*')
        .single()
    ]);

    // Default config if table doesn't exist or no data
    const defaultConfig = {
      max_packages: 50,
      max_letters: 200,
      packages_warning_threshold: 70,
      packages_critical_threshold: 90,
      letters_warning_threshold: 70,
      letters_critical_threshold: 90
    };

    // Use fetched config or fallback to defaults
    const config = storageConfigResult.data || defaultConfig;

    if (storageConfigResult.error) {
      console.warn('Storage config not available, using defaults:', storageConfigResult.error.message);
    }

    const packagesCount = packagesUsed || 0;
    const lettersCount = lettersUsed || 0;

    const storage: StorageOverview = {
      packages: {
        used: packagesCount,
        max: config.max_packages,
        percentage: config.max_packages > 0 ? Math.round((packagesCount / config.max_packages) * 100) : 0,
        warningThreshold: config.packages_warning_threshold,
        criticalThreshold: config.packages_critical_threshold
      },
      letters: {
        used: lettersCount,
        max: config.max_letters,
        percentage: config.max_letters > 0 ? Math.round((lettersCount / config.max_letters) * 100) : 0,
        warningThreshold: config.letters_warning_threshold,
        criticalThreshold: config.letters_critical_threshold
      }
    };

    return {
      monthlyInbound: monthlyInbound || 0,
      pendingPickup: pendingPickup || 0,
      totalDigitized,
      activityByDay,
      notificationEfficiency,
      storage
    };
  },

  async notifyCorrespondence(correspondenceId: string) {
    // 1. Fetch correspondence details
    const { data: item, error: fetchError } = await supabase
      .from('correspondence')
      .select('*')
      .eq('id', correspondenceId)
      .single();

    if (fetchError || !item) {
      console.error('Error fetching correspondence for notification:', fetchError);
      return { error: fetchError?.message || 'Item no encontrado' };
    }

    // 2. Fetch recipient profile if possible to get their configured notification email
    let emailToNotify = item.recipient_email;
    let nameToNotify = item.recipient;

    if (item.recipient_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_email, email, full_name, email_notifications')
        .eq('id', item.recipient_id)
        .single();

      if (profile) {
        // Verificar si el usuario tiene desactivadas las notificaciones por email
        if (profile.email_notifications === false) {
          return { error: 'El usuario ha desactivado las notificaciones por email en sus preferencias.' };
        }

        // Priority: 1. notification_email, 2. profile email, 3. correspondence email
        emailToNotify = profile.notification_email || profile.email || item.recipient_email;
        nameToNotify = profile.full_name || item.recipient;
      }
    }

    if (!emailToNotify) {
      return { error: 'No se encontró un email válido para notificar.' };
    }

    // 3. Call Edge Function
    const { data, error: funcError } = await supabase.functions.invoke('notify-correspondence', {
      body: {
        recipientName: nameToNotify,
        recipientEmail: emailToNotify,
        senderName: item.sender,
        type: item.type,
        date: item.date,
        time: item.time,
        dashboardUrl: `${window.location.origin}`
      }
    });

    if (funcError) {
      console.error('Error calling notification function:', funcError);
      // Detailed error log for the user to debug
      if (funcError.message?.includes('Failed to send a request')) {
        return { error: 'Error de conexión: Verifica que la Edge Function esté desplegada y configurada correctamente en Supabase.' };
      }
      return { error: funcError.message };
    }

    // 3. Update status
    await supabase
      .from('correspondence')
      .update({ email_status: EmailStatus.SENT })
      .eq('id', correspondenceId);

    return { data, error: null };
  }
};

// Audit Log Service
export const auditService = {
  async logEvent(payload: {
    eventType: 'CREATE' | 'UPDATE' | 'DELETE' | 'NOTIFY' | 'DELIVER' | 'DIGITIZE' | 'LOGIN' | 'STATUS_CHANGE';
    resourceType: 'CORRESPONDENCE' | 'USER' | 'AUTH';
    resourceId?: string;
    details: string;
    userName?: string;
    status?: 'Exitoso' | 'Fallido' | 'Informativo';
  }) {
    const { data: { user } } = await supabase.auth.getUser();

    // If userName is not provided, fetch it from profiles
    let finalUserName = payload.userName;
    if (!finalUserName && user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.full_name) {
        finalUserName = profile.full_name;
      }
    }

    // Try to use RPC function first (server-side enforcement)
    const { data: rpcData, error: rpcError } = await supabase.rpc('log_audit_event', {
      p_event_type: payload.eventType,
      p_resource_type: payload.resourceType,
      p_resource_id: payload.resourceId || null,
      p_details: payload.details,
      p_status: payload.status || 'Exitoso'
    });

    // If RPC fails, fallback to direct insert (for backward compatibility)
    if (rpcError) {
      console.warn('RPC log_audit_event failed, using direct insert:', rpcError);
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: payload.eventType,
          resource_type: payload.resourceType,
          resource_id: payload.resourceId,
          details: payload.details,
          user_id: user?.id,
          user_name: finalUserName || 'Sistema',
          status: payload.status || 'Exitoso',
          is_legacy: false
        });

      if (error) {
        console.error('Error logging audit event:', error);
      }
    }
  },

  async getLogs(filters?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    userId?: string;
    status?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('is_legacy', false)
        .order('created_at', { ascending: false });

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // Si es un error de permisos, dar mensaje más claro
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('Error de permisos: El usuario no tiene permisos para leer audit_logs. Verifica que sea super_admin.');
        }

        return { data: [], count: 0 };
      }

      console.log(`Successfully fetched ${data?.length || 0} audit logs (Total: ${count})`);
      return { data: data || [], count: count || 0 };
    } catch (err: any) {
      console.error('Unexpected error in getLogs:', err);
      return { data: [], count: 0 };
    }
  },

  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching users for filter:', error);
        return [];
      }

      return data || [];
    } catch (err: any) {
      console.error('Unexpected error in getUsers:', err);
      return [];
    }
  }
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data?.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let val = row[header];
      if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
      return val ?? '';
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const notificationService = {
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    return { data, error };
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    return { error };
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    return { error };
  },

  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    return { error };
  }
};

export const userService = {
  async updateProfile(id: string, updates: {
    full_name?: string;
    phone_number?: string;
    company?: string;
    email_notifications?: boolean;
    weekly_report?: boolean;
    alert_sounds?: boolean;
    avatar_url?: string;
    notification_email?: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      await auditService.logEvent({
        eventType: 'UPDATE',
        resourceType: 'USER',
        resourceId: id,
        details: 'Perfil de usuario actualizado'
      });
    }

    return { data, error };
  },

  async uploadAvatar(userId: string, file: File) {
    // Determinar extensión basada en el tipo de archivo
    const fileExt = file.type === 'image/webp' ? 'webp' : file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) return { url: null, error: uploadError };

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (!uploadError && publicUrl) {
      const fileSizeKB = (file.size / 1024).toFixed(1);
      await auditService.logEvent({
        eventType: 'UPDATE',
        resourceType: 'USER',
        resourceId: userId,
        details: `Avatar actualizado (${fileExt.toUpperCase()}, ${fileSizeKB}KB)`
      });
    }

    return { url: publicUrl, error: null };
  }
};

export const authService = {
  async verifyCurrentPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { success: !error, error: error?.message };
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password
    });
    return { error: error?.message || null };
  },

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}?type=recovery`,
    });
    return { error: error?.message || null };
  }
};

// Storage Configuration Service
export const storageConfigService = {
  async getConfig(): Promise<StorageConfig | null> {
    const { data, error } = await supabase
      .from('storage_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching storage config:', error);
      return null;
    }

    return data;
  },

  async updateConfig(updates: Partial<Omit<StorageConfig, 'id' | 'updated_at' | 'updated_by'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('storage_config')
      .update(updates)
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      console.error('Error updating storage config:', error);
      return { error: error.message };
    }

    return { error: null };
  },

  canEdit(userRole: string): boolean {
    return ['super_admin', 'admin'].includes(userRole);
  },

  canView(userRole: string): boolean {
    return ['super_admin', 'admin', 'recepcionista'].includes(userRole);
  }
};
