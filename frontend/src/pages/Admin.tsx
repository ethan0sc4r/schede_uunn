import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import type { User } from '../types/index.ts';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const queryClient = useQueryClient();

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

  const handleActivate = async (userId: number) => {
    try {
      await activateMutation.mutateAsync(userId);
      alert('Utente attivato con successo');
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'attivazione dell\'utente');
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler disattivare questo utente?')) {
      try {
        await deactivateMutation.mutateAsync(userId);
        alert('Utente disattivato con successo');
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante la disattivazione dell\'utente');
      }
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler rendere questo utente amministratore?')) {
      try {
        await makeAdminMutation.mutateAsync(userId);
        alert('Utente promosso ad amministratore');
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante la promozione dell\'utente');
      }
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (window.confirm('Sei sicuro di voler rimuovere i privilegi di amministratore?')) {
      try {
        await removeAdminMutation.mutateAsync(userId);
        alert('Privilegi di amministratore rimossi');
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante la rimozione dei privilegi');
      }
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
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: User;
  onActivate: () => void;
  onDeactivate: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
}

function UserCard({ user, onActivate, onDeactivate, onMakeAdmin, onRemoveAdmin }: UserCardProps) {
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