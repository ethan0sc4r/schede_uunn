import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import type { User } from '../types/index.ts';
import { Key, Shield, UserCheck, UserX, UserPlus, Settings } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settings'>('pending');
  const [showPasswordModal, setShowPasswordModal] = useState<{user?: User; isOwnPassword?: boolean} | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { success, error: showError, warning } = useToast();

  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getAllUsers(),
    enabled: activeTab === 'all',
  });

  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ['admin', 'pending-users'],
    queryFn: () => adminApi.getPendingUsers(),
    enabled: activeTab === 'pending',
  });

  const activateMutation = useMutation({
    mutationFn: adminApi.activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: adminApi.deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: adminApi.makeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: adminApi.removeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) =>
      adminApi.changeUserPassword(userId, newPassword),
    onSuccess: () => {
      setShowPasswordModal(null);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password cambiata con successo!');
    },
    onError: (error: any) => {
      showError(`Errore nel cambio password: ${error.response?.data?.detail || error.message}`);
    }
  });

  const changeOwnPasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      adminApi.changeOwnPassword(currentPassword, newPassword),
    onSuccess: () => {
      setShowPasswordModal(null);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password amministratore cambiata con successo!');
    },
    onError: (error: any) => {
      showError(`Errore nel cambio password: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleActivate = async (userId: number) => {
    try {
      await activateMutation.mutateAsync(userId);
      success('Utente attivato con successo');
    } catch (error) {
      console.error('Errore:', error);
      showError('Errore durante l\'attivazione dell\'utente');
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler disattivare questo utente?')) {
      try {
        await deactivateMutation.mutateAsync(userId);
        success('Utente disattivato con successo');
      } catch (error) {
        console.error('Errore:', error);
        showError('Errore durante la disattivazione dell\'utente');
      }
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler rendere questo utente amministratore?')) {
      try {
        await makeAdminMutation.mutateAsync(userId);
        success('Utente promosso ad amministratore');
      } catch (error) {
        console.error('Errore:', error);
        showError('Errore durante la promozione dell\'utente');
      }
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler rimuovere i privilegi di amministratore?')) {
      try {
        await removeAdminMutation.mutateAsync(userId);
        success('Privilegi di amministratore rimossi');
      } catch (error) {
        console.error('Errore:', error);
        showError('Errore durante la rimozione dei privilegi');
      }
    }
  };

  const handleChangePassword = (user: User) => {
    setShowPasswordModal({ user });
  };

  const handleChangeOwnPassword = () => {
    setShowPasswordModal({ isOwnPassword: true });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      warning('Le password non coincidono!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      warning('La password deve essere di almeno 6 caratteri!');
      return;
    }
    
    if (showPasswordModal?.isOwnPassword) {
      changeOwnPasswordMutation.mutate({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
    } else if (showPasswordModal?.user) {
      changePasswordMutation.mutate({
        userId: showPasswordModal.user.id,
        newPassword: passwordForm.newPassword
      });
    }
  };

  const currentUsers = activeTab === 'all' ? allUsers : pendingUsers;
  const isLoading = activeTab === 'all' ? allUsersLoading : pendingUsersLoading;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pannello Amministrazione</h1>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Utenti in Attesa ({pendingUsers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tutti gli Utenti
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Impostazioni
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Impostazioni Amministratore
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Cambia Password Amministratore</h4>
                      <p className="text-sm text-gray-600">Modifica la tua password di amministratore</p>
                    </div>
                    <button
                      onClick={handleChangeOwnPassword}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Cambia Password
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Utenti totali:</span>
                    <span className="ml-2 text-gray-900">{allUsers?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Utenti attivi:</span>
                    <span className="ml-2 text-gray-900">{allUsers?.filter(u => u.is_active).length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Utenti in attesa:</span>
                    <span className="ml-2 text-gray-900">{pendingUsers?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Amministratori:</span>
                    <span className="ml-2 text-gray-900">{allUsers?.filter(u => u.is_admin).length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : !currentUsers || currentUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'pending' 
                ? 'Nessun utente in attesa di approvazione'
                : 'Nessun utente trovato'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {currentUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onActivate={() => handleActivate(user.id)}
                  onDeactivate={() => handleDeactivate(user.id)}
                  onMakeAdmin={() => handleMakeAdmin(user.id)}
                  onRemoveAdmin={() => handleRemoveAdmin(user.id)}
                  onChangePassword={() => handleChangePassword(user)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              {showPasswordModal.isOwnPassword ? 'Cambia Password Amministratore' : `Cambia Password - ${showPasswordModal.user?.first_name} ${showPasswordModal.user?.last_name}`}
            </h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {showPasswordModal.isOwnPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Attuale
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuova Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimo 6 caratteri</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Nuova Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(null);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending || changeOwnPasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {(changePasswordMutation.isPending || changeOwnPasswordMutation.isPending) ? 'Aggiornamento...' : 'Cambia Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: User;
  onActivate: () => void;
  onDeactivate: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
  onChangePassword: () => void;
}

function UserCard({ user, onActivate, onDeactivate, onMakeAdmin, onRemoveAdmin, onChangePassword }: UserCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div className="flex gap-2">
              {user.is_admin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Admin
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Attivo' : 'Inattivo'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>

        <div className="flex gap-2">
          {!user.is_active ? (
            <button
              onClick={onActivate}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Attiva
            </button>
          ) : (
            <button
              onClick={onDeactivate}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Disattiva
            </button>
          )}

          {user.is_active && (
            <>
              <button
                onClick={onChangePassword}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center"
                title="Cambia password"
              >
                <Key className="h-3 w-3 mr-1" />
                Password
              </button>
              
              {!user.is_admin ? (
                <button
                  onClick={onMakeAdmin}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  Rendi Admin
                </button>
              ) : (
                <button
                  onClick={onRemoveAdmin}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                >
                  Rimuovi Admin
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}