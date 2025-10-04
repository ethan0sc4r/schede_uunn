import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, GitBranch, Tag, User, Trash2, RotateCcw, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface Version {
  id: number;
  unit_id: number;
  version_number: string;
  version_name: string;
  layout_config: any;
  characteristics: any[];
  unit_data: any;
  change_summary: string;
  tags: string[];
  created_by: number;
  created_by_name: string;
  created_at: string;
  is_published: boolean;
  is_current: boolean;
}

interface VersionManagerProps {
  unitId: number;
  isOpen: boolean;
  onClose: () => void;
  onVersionSelected?: (version: Version) => void;
}

const VersionManager: React.FC<VersionManagerProps> = ({
  unitId,
  isOpen,
  onClose
}) => {
  const { success, error: showError, warning, info } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    version_name: '',
    change_summary: '',
    tags: [] as string[]
  });

  const queryClient = useQueryClient();

  // Fetch versions
  const { data: versionsData, isLoading, error } = useQuery({
    queryKey: ['unit-versions', unitId],
    queryFn: async () => {
      const response = await fetch(`/api/units/${unitId}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    },
    enabled: isOpen && !!unitId
  });

  const versions = versionsData?.versions || [];

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (versionData: any) => {
      const response = await fetch(`/api/units/${unitId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(versionData)
      });
      if (!response.ok) throw new Error('Failed to create version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-versions', unitId] });
      setShowCreateModal(false);
      setNewVersionData({ version_name: '', change_summary: '', tags: [] });
    }
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionNumber: string) => {
      const response = await fetch(`/api/units/${unitId}/versions/${versionNumber}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to restore version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-versions', unitId] });
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
      success('Versione ripristinata con successo!');
    }
  });

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: async (versionNumber: string) => {
      const response = await fetch(`/api/units/${unitId}/versions/${versionNumber}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-versions', unitId] });
    }
  });

  const handleCreateVersion = () => {
    createVersionMutation.mutate(newVersionData);
  };

  const handleRestoreVersion = (version: Version) => {
    if (window.confirm(`Sei sicuro di voler ripristinare la versione ${version.version_number}?`)) {
      restoreVersionMutation.mutate(version.version_number);
    }
  };

  const handleDeleteVersion = (version: Version) => {
    if (window.confirm(`Sei sicuro di voler eliminare la versione ${version.version_number}?`)) {
      deleteVersionMutation.mutate(version.version_number);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Gestione Versioni</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuova Versione
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Versions List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Versioni Disponibili</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-sm py-4">
                  Errore nel caricamento delle versioni
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version: Version) => (
                    <div
                      key={version.version_number}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedVersion?.version_number === version.version_number
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${version.is_current ? 'border-green-500 bg-green-50' : ''}`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            v{version.version_number}
                          </span>
                          {version.is_current && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Corrente
                            </span>
                          )}
                          {version.is_published && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Pubblicata
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 mt-1">
                        {version.version_name}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{version.created_by_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(version.created_at)}</span>
                        </div>
                      </div>

                      {version.tags && version.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <div className="flex space-x-1">
                            {version.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-1 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Version Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4">
              {selectedVersion ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">
                      Dettagli Versione v{selectedVersion.version_number}
                    </h3>
                    <div className="flex space-x-2">
                      {!selectedVersion.is_current && (
                        <button
                          onClick={() => handleRestoreVersion(selectedVersion)}
                          disabled={restoreVersionMutation.isPending}
                          className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Ripristina
                        </button>
                      )}
                      {!selectedVersion.is_current && (
                        <button
                          onClick={() => handleDeleteVersion(selectedVersion)}
                          disabled={deleteVersionMutation.isPending}
                          className="flex items-center px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Elimina
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Nome Versione:</label>
                      <p className="text-gray-900">{selectedVersion.version_name}</p>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700">Sommario Modifiche:</label>
                      <p className="text-gray-900">
                        {selectedVersion.change_summary || 'Nessuna descrizione'}
                      </p>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700">Creata da:</label>
                      <p className="text-gray-900">{selectedVersion.created_by_name}</p>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700">Data Creazione:</label>
                      <p className="text-gray-900">{formatDate(selectedVersion.created_at)}</p>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700">Caratteristiche:</label>
                      <p className="text-gray-900">
                        {selectedVersion.characteristics?.length || 0} caratteristiche
                      </p>
                    </div>

                    <div>
                      <label className="font-medium text-gray-700">Elementi Canvas:</label>
                      <p className="text-gray-900">
                        {selectedVersion.layout_config?.elements?.length || 0} elementi
                      </p>
                    </div>

                    {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                      <div>
                        <label className="font-medium text-gray-700">Tags:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVersion.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Seleziona una versione per vedere i dettagli
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Version Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Crea Nuova Versione</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Versione
                  </label>
                  <input
                    type="text"
                    value={newVersionData.version_name}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, version_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Aggiornamento template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sommario Modifiche
                  </label>
                  <textarea
                    value={newVersionData.change_summary}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, change_summary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descrivi le modifiche apportate..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={createVersionMutation.isPending}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {createVersionMutation.isPending ? 'Creazione...' : 'Crea Versione'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionManager;