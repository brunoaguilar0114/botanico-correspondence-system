
import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { History } from './components/History';
import { Users } from './components/Users';
import { Settings } from './components/Settings';
import { CorrespondenceCard } from './components/CorrespondenceCard';
import { ResetPassword } from './components/ResetPassword';
import { User, Correspondence, PackageStatus, UserRole } from './types';
import { supabase } from './services/client';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { correspondenceService, auditService } from './services/supabase';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { NotificationSystemProvider } from './contexts/NotificationSystemContext';
import { Toast, ToastContainer } from './components/Notification/Toast';
import { Modal } from './components/Notification/Modal';

const AppContent: React.FC = () => {
  const { user: currentUser, loading: authLoading, signOut, isStaff } = useAuth();
  const { toasts, removeToast, modal, hideModal, showToast } = useNotifications();
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [items, setItems] = useState<Correspondence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Detect recovery link
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setIsRecovering(true);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('vadavo-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // ... (keep existing refreshData and hooks) ...

  const refreshData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const data = isStaff()
      ? await correspondenceService.getAll()
      : await correspondenceService.getByUserId(currentUser.email);
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser?.email]);

  const handleNewRecord = async (payload: any) => {
    const { shouldNotify, ...createPayload } = payload;
    const { data: newRecord, error } = await correspondenceService.create(createPayload);

    if (!error && newRecord) {
      await refreshData();
      await refreshData();
      showToast('Registro creado exitosamente', 'success');

      if (shouldNotify) {
        showToast('Enviando notificación...', 'info');
        const { error: notifyError } = await correspondenceService.notifyCorrespondence(newRecord.id);
        if (notifyError) {
          showToast('Error al notificar: ' + notifyError, 'error');
          await auditService.logEvent({
            eventType: 'NOTIFY',
            resourceType: 'CORRESPONDENCE',
            resourceId: newRecord.id,
            details: `Fallo al enviar notificación: ${notifyError}`,
            userName: currentUser?.name,
            status: 'Fallido'
          });
        } else {
          showToast('Notificación enviada', 'success');
          await auditService.logEvent({
            eventType: 'NOTIFY',
            resourceType: 'CORRESPONDENCE',
            resourceId: newRecord.id,
            details: `${currentUser?.name} envió notificación a ${createPayload.recipient} (${createPayload.recipient_email})`,
            userName: currentUser?.name
          });
        }
      }
    } else {
      showToast('Error al crear registro: ' + error, 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: PackageStatus) => {
    const updates: any = { status };
    if (status === PackageStatus.DELIVERED) {
      updates.delivered_by = currentUser?.id;
      updates.delivered_at = new Date().toISOString();
    } else if (status === PackageStatus.SCANNED) {
      updates.digitized_at = new Date().toISOString();
    }

    // Fetch item details for audit log
    const item = items.find(i => i.id === id);
    const clientName = item?.recipient || 'Cliente';

    await correspondenceService.updateStatusWithTracking(id, updates);
    await refreshData();
    showToast('Estado actualizado', 'success');

    // Log audit event with detailed information
    const eventType = status === PackageStatus.DELIVERED ? 'DELIVER' :
      status === PackageStatus.SCANNED ? 'DIGITIZE' : 'STATUS_CHANGE';

    let details = '';
    if (status === PackageStatus.DELIVERED) {
      details = `${currentUser?.name} entregó correspondencia a ${clientName}`;
    } else if (status === PackageStatus.SCANNED) {
      details = `${currentUser?.name} digitalizó correspondencia de ${clientName}`;
    } else {
      details = `${currentUser?.name} actualizó estado a ${status} para ${clientName}`;
    }

    await auditService.logEvent({
      eventType,
      resourceType: 'CORRESPONDENCE',
      resourceId: id,
      details,
      userName: currentUser?.name
    });
  };

  const handleUpdateRecord = async (id: string, payload: any) => {
    const { shouldNotify, ...updatePayload } = payload;
    
    // Get item details for audit log
    const item = items.find(i => i.id === id);
    const clientName = item?.recipient || 'Cliente';
    
    const { error } = await correspondenceService.update(id, updatePayload);
    if (!error) {
      await refreshData();
      showToast('Registro actualizado', 'success');

      if (shouldNotify) {
        showToast('Enviando notificación...', 'info');
        const { error: notifyError } = await correspondenceService.notifyCorrespondence(id);
        if (!notifyError) {
          showToast('Notificación enviada', 'success');
          await auditService.logEvent({
            eventType: 'NOTIFY',
            resourceType: 'CORRESPONDENCE',
            resourceId: id,
            details: `${currentUser?.name} envió notificación de actualización a ${clientName}`,
            userName: currentUser?.name
          });
        } else {
          showToast('Error al notificar: ' + notifyError, 'error');
        }
      }
    } else {
      showToast('Error al actualizar: ' + error, 'error');
    }
  };

  /* handleDigitizeRecord replaced by AttachmentManagerModal */

  const handleDeleteRecord = async (id: string) => {
    // Get item details before deletion
    const item = items.find(i => i.id === id);
    const clientName = item?.recipient || 'Cliente';

    const { error } = await correspondenceService.delete(id);
    if (!error) {
      await refreshData();
      showToast('Registro eliminado', 'warning');
    } else {
      showToast('Error al eliminar: ' + error, 'error');
    }
  };

  const handleResendNotification = async (id: string) => {
    showToast('Reenviando notificación...', 'info');

    // Get item details for audit log
    const item = items.find(i => i.id === id);
    const clientName = item?.recipient || 'Cliente';

    const { error } = await correspondenceService.notifyCorrespondence(id);
    if (!error) {
      await refreshData();
      showToast('Notificación reenviada correctamente', 'success');

      // Log audit event
      await auditService.logEvent({
        eventType: 'NOTIFY',
        resourceType: 'CORRESPONDENCE',
        resourceId: id,
        details: `${currentUser?.name} reenvió notificación a ${clientName}`,
        userName: currentUser?.name
      });
    } else {
      showToast('Error al reenviar: ' + error, 'error');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('vadavo-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter(c =>
      c.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const renderView = () => {
    // Shared view for all users
    if (currentView === 'settings') {
      return <Settings onBack={() => setCurrentView('dashboard')} />;
    }

    if (!isStaff()) {
      // Client default view (history-like list)
      return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-4 px-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 transition-theme">Mi Correspondencia</h1>
              <p className="text-gray-400 font-bold">Oficina Virtual - Botánico Coworking</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {filteredItems.length} Envíos
            </span>
          </div>
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <CorrespondenceCard key={item.id} item={item} />
            ))
          ) : (
            <div className="neu-surface rounded-[40px] p-20 text-center transition-theme">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 transition-theme">drafts</span>
              <p className="text-gray-400 font-bold">No tienes correspondencia pendiente.</p>
            </div>
          )}
        </div>
      );
    }

    // Default view for staff should be management or dashboard
    const view = currentView === 'dashboard' && isStaff() ? 'dashboard' : currentView;

    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'management':
        return (
          <AdminDashboard
            currentUser={currentUser}
            data={filteredItems}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNewRecord={handleNewRecord}
            onUpdateStatus={handleUpdateStatus}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onResendNotification={handleResendNotification}
            onRefresh={refreshData}
          />
        );
      case 'history':
        // Solo super_admin puede ver el historial de auditoría
        if (currentUser?.role === 'super_admin') {
          return <History />;
        }
        // Si no es super_admin, redirigir al dashboard
        return <Dashboard />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  if (authLoading) {
    console.log('Auth loading...');
    return (
      <div className="min-h-screen bg-neu-bg-light dark:bg-neu-bg-dark flex items-center justify-center transition-theme">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isRecovering) {
    return <ResetPassword onComplete={() => {
      setIsRecovering(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshData();
    }} />;
  }

  if (!currentUser) return <Login onLogin={() => { }} />;

  console.log('Rendering App for role:', currentUser.role, 'View:', currentView);

  return (
    <div className="min-h-screen bg-neu-bg-light dark:bg-neu-bg-dark flex transition-theme font-inter">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        onLogout={signOut}
        role={currentUser.role}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={currentUser}
          onLogout={signOut}
          onProfileClick={() => setCurrentView('settings')}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>

      {modal && (
        <Modal
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onClose={hideModal}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationSystemProvider>
          <AppContent />
        </NotificationSystemProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
