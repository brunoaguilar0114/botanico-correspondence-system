import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, UserRole } from '../types';
import { supabase } from '../services/client';
import { useNotifications } from '../contexts/NotificationContext';
import { UserHistoryModal } from './UserHistoryModal';
import { Portal } from './Portal';

export const Users: React.FC = () => {
  const { user: currentUser, canManage } = useAuth();
  const { showToast, showModal } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'cliente' as UserRole,
    password: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');

    // Hierarchy filtering
    if (currentUser?.role === 'admin') {
      query = query.in('role', ['recepcionista', 'cliente']);
    } else if (currentUser?.role === 'super_admin') {
      query = query.in('role', ['admin', 'recepcionista', 'cliente']);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) {
      setUsers(data.map(d => ({
        id: d.id,
        name: d.full_name,
        email: d.email,
        role: d.role,
        phone_number: d.phone_number,
        status: d.status
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage(formData.role)) return showToast('No tienes permisos para crear este rol', 'error');

    const { error: funcError } = await supabase.functions.invoke('create-user', {
      body: {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        fullName: formData.fullName,
        phone: formData.phone
      }
    });

    if (funcError) {
      console.error('Function Error:', funcError);
      const errorData = (funcError as any).context?.body;
      let msg = funcError.message;
      if (errorData) {
        try {
          const parsed = typeof errorData === 'string' ? JSON.parse(errorData) : errorData;
          if (parsed.error) msg = parsed.error;
        } catch (e) { }
      }
      return showToast('Error al crear usuario: ' + msg, 'error');
    }

    setIsModalOpen(false);
    fetchUsers();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'cliente' as UserRole,
      password: ''
    });
    showToast('Usuario creado exitosamente', 'success');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.name,
      email: user.email,
      phone: user.phone_number || '',
      role: user.role,
      password: ''
    });
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleDeleteUser = async (user: User) => {
    setActiveMenu(null);

    // Verificar si el usuario tiene datos asociados
    const { count: correspondenceCount } = await supabase
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .or(`recipient_id.eq.${user.id},delivered_by.eq.${user.id}`);

    const hasAssociatedData = (correspondenceCount || 0) > 0;
    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Construir mensaje según el contexto
    let message = `¿Estás seguro de que deseas eliminar a ${user.name}?`;

    if (hasAssociatedData) {
      if (isSuperAdmin) {
        message = `⚠️ ${user.name} tiene ${correspondenceCount} registro(s) de correspondencia asociados.\n\nComo super administrador, puedes eliminar este usuario. La correspondencia asociada será desvinculada pero no eliminada.\n\n¿Deseas continuar?`;
      } else {
        showToast(`No se puede eliminar: ${user.name} tiene ${correspondenceCount} registro(s) de correspondencia asociados. Solo un super administrador puede eliminarlo.`, 'error');
        return;
      }
    } else {
      message += ' Esta acción no se puede deshacer.';
    }

    showModal({
      title: 'Eliminar Usuario',
      message,
      type: 'confirm',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId: user.id }
        });

        if (error) {
          // Intentar parsear el error del body si existe
          let errorMessage = error.message;
          try {
            const errorBody = (error as any).context?.body;
            if (errorBody) {
              const parsed = typeof errorBody === 'string' ? JSON.parse(errorBody) : errorBody;
              if (parsed.error) errorMessage = parsed.error;
            }
          } catch (e) { }
          showToast('Error al eliminar usuario: ' + errorMessage, 'error');
        } else {
          const deletedInfo = data?.deletedData;
          let successMessage = 'Usuario eliminado exitosamente';
          if (deletedInfo?.correspondenceUnlinked > 0) {
            successMessage += ` (${deletedInfo.correspondenceUnlinked} registros desvinculados)`;
          }
          showToast(successMessage, 'success');
          fetchUsers();
        }
      }
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const { error } = await supabase.functions.invoke('update-user', {
      body: {
        userId: editingUser.id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      }
    });

    if (error) {
      showToast('Error al actualizar usuario: ' + error.message, 'error');
    } else {
      showToast('Usuario actualizado correctamente', 'success');
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    }
  };

  const getTargetRoles = (): UserRole[] => {
    if (currentUser?.role === 'super_admin') return ['admin', 'recepcionista', 'cliente'];
    if (currentUser?.role === 'admin') return ['recepcionista', 'cliente'];
    if (currentUser?.role === 'recepcionista') return ['cliente'];
    return [];
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 px-4 pt-6 md:pt-0 font-inter">
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-800 dark:text-gray-100 transition-theme">Usuarios</h1>
          <p className="text-gray-400 dark:text-gray-500 text-base md:text-lg font-bold transition-theme leading-tight">Gestión jerárquica de miembros del sistema.</p>
        </div>
        {getTargetRoles().length > 0 && (
          <button
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="neu-btn-primary h-14 md:h-16 px-8 md:px-10 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-theme w-full md:w-auto active:scale-95"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">person_add</span>
            Añadir Usuario
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 px-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full h-14 md:h-16 rounded-full neu-inset border-none pl-14 md:pl-16 pr-8 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative group">
          <select
            className="w-full md:w-auto h-14 md:h-16 rounded-full neu-surface border-none px-8 pr-12 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 appearance-none md:min-w-[200px] cursor-pointer focus:ring-2 focus:ring-primary/20"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">TODOS LOS ROLES</option>
            <option value="admin">ADMINISTRADORES</option>
            <option value="recepcionista">RECEPCIONISTAS</option>
            <option value="cliente">CLIENTES</option>
          </select>
          <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
        </div>
      </div>

      <div className="neu-surface rounded-[40px] md:rounded-[60px] p-6 md:p-12 transition-theme">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 transition-theme">
                <th className="pb-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-6">Usuario</th>
                <th className="pb-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Rol</th>
                <th className="pb-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Estado</th>
                <th className="pb-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-white/30 dark:hover:bg-black/10 transition-colors">
                  <td className="py-8 pl-6">
                    <div className="flex items-center gap-5">
                      <div className="size-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black uppercase transition-theme">
                        {u.name?.[0] || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 transition-theme">{u.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-theme ${u.role === 'super_admin' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' :
                      u.role === 'admin' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                        u.role === 'recepcionista' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-gray-400 border-gray-100'
                      }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-8">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{u.status}</span>
                    </div>
                  </td>
                  <td className="py-8 text-right pr-6 relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                      className="size-10 neu-btn rounded-full text-gray-400 hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                    {activeMenu === u.id && (
                      <div className="absolute right-6 top-20 z-10 w-48 neu-surface rounded-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            setSelectedHistoryUser(u);
                            setActiveMenu(null);
                          }}
                          className="w-full px-6 py-3 text-left text-sm font-bold text-primary hover:bg-primary/5 flex items-center gap-3 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">history</span>
                          Ver Historial
                        </button>
                        <button
                          onClick={() => handleEditUser(u)}
                          className="w-full px-6 py-3 text-left text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="w-full px-6 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden flex flex-col gap-6">
          {filteredUsers.map((u) => (
            <div key={u.id} className="neu-surface rounded-[30px] p-6 flex flex-col gap-6 border border-gray-100/50 dark:border-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 neu-inset rounded-2xl flex items-center justify-center text-primary font-black uppercase text-xs">
                    {u.name?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">{u.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{u.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                  className="size-10 neu-btn rounded-full text-gray-400 active:text-primary transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">more_vert</span>
                </button>
              </div>

              {activeMenu === u.id && (
                <div className="neu-inset rounded-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setSelectedHistoryUser(u);
                      setActiveMenu(null);
                    }}
                    className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">history</span>
                    Ver Historial
                  </button>
                  <button
                    onClick={() => handleEditUser(u)}
                    className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Eliminar
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/50 pt-4 px-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-theme ${u.role === 'super_admin' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' :
                  u.role === 'admin' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                    u.role === 'recepcionista' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-gray-400 border-gray-100'
                  }`}>
                  {u.role.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{u.status}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">person_off</span>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin usuarios</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <Portal>
        <div className="fixed inset-0 z-[120] flex items-center justify-center glass px-6">
          <div className="neu-surface w-full max-w-[500px] rounded-[60px] p-12">
            <h2 className="text-2xl font-black text-gray-700 dark:text-gray-100 mb-8 uppercase tracking-tight">
              {editingUser ? 'Editar Usuario' : `Nuevo ${formData.role.replace('_', ' ')}`}
            </h2>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-6">
              <input
                placeholder="Nombre Completo"
                className="w-full h-14 rounded-full neu-inset border-none px-8 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <input
                placeholder="Email"
                type="email"
                className="w-full h-14 rounded-full neu-inset border-none px-8 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <select
                className="w-full h-14 rounded-full neu-inset border-none px-8 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 appearance-none bg-transparent"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                {getTargetRoles().map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
              {!editingUser && (
                <input
                  placeholder="Contraseña Temporal"
                  type="password"
                  className="w-full h-14 rounded-full neu-inset border-none px-8 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="flex-1 h-14 neu-btn rounded-full font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 h-14 neu-btn-primary rounded-full font-black uppercase text-[10px] tracking-widest">
                  {editingUser ? 'Guardar Cambios' : 'Crear Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}
      {selectedHistoryUser && (
        <UserHistoryModal
          user={selectedHistoryUser}
          onClose={() => setSelectedHistoryUser(null)}
        />
      )}
    </div>
  );
};