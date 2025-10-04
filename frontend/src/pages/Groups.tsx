import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi, navalUnitsApi } from '../services/api';
import type { Group, CreateGroupRequest } from '../types/index.ts';
import GroupCard from '../components/GroupCard';
import GroupModalAdvanced from '../components/GroupModalAdvanced';
import PresentationMode from '../components/PresentationMode';
import { useToast } from '../contexts/ToastContext';

export default function Groups() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [presentationGroup, setPresentationGroup] = useState<Group | null>(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getAll(),
  });

  const { data: navalUnits } = useQuery({
    queryKey: ['navalUnits'],
    queryFn: () => navalUnitsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateGroupRequest }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const handleCreate = useCallback(() => {
    setSelectedGroup(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((group: Group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questo gruppo?')) {
      try {
        await deleteMutation.mutateAsync(id);
        success('Gruppo eliminato con successo');
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        showError('Errore durante l\'eliminazione del gruppo');
      }
    }
  }, [deleteMutation, success, showError]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  }, []);

  const handleGroupSave = useCallback(async (groupData: CreateGroupRequest) => {
    try {
      if (selectedGroup) {
        await updateMutation.mutateAsync({ id: selectedGroup.id, data: groupData });
      } else {
        await createMutation.mutateAsync(groupData);
      }
      success('Gruppo salvato con successo');
      handleModalClose();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showError('Errore durante il salvataggio del gruppo');
    }
  }, [selectedGroup, updateMutation, createMutation, success, showError, handleModalClose]);

  const handlePresentation = useCallback((group: Group) => {
    setPresentationGroup(group);
    setIsPresentationOpen(true);
  }, []);

  const handlePresentationClose = useCallback(() => {
    setIsPresentationOpen(false);
    setPresentationGroup(null);
  }, []);

  const handleExportPowerPoint = async (group: Group) => {
    try {
      console.log('Starting PowerPoint export for group:', group.id);
      const blob = await groupsApi.exportPowerPoint(group.id);
      console.log('PowerPoint export successful, blob size:', blob.size);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create safe filename
      const safeName = group.name.replace(/[^a-zA-Z0-9\s\-_]/g, '');
      link.download = `${safeName}_presentation.pptx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      success('PowerPoint esportato con successo');
    } catch (error) {
      console.error('Errore durante l\'export PowerPoint:', error);
      console.error('Error details:', (error as any).response?.data || (error as any).message);
      showError(`Errore durante l'export PowerPoint: ${(error as any).response?.data?.detail || (error as any).message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Errore nel caricamento dei gruppi
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gruppi</h1>
        <button
          onClick={handleCreate}
          className="btn-primary"
        >
          + Nuovo Gruppo
        </button>
      </div>

      {!groups || groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Nessun gruppo trovato
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            Crea il primo gruppo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={() => handleEdit(group)}
              onDelete={() => handleDelete(group.id)}
              onPresentation={() => handlePresentation(group)}
              onExportPowerPoint={() => handleExportPowerPoint(group)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <GroupModalAdvanced
          isOpen={isModalOpen}
          group={selectedGroup}
          onClose={handleModalClose}
          onSave={handleGroupSave}
          availableUnits={navalUnits || []}
          availableGroups={groups || []}
        />
      )}

      {isPresentationOpen && presentationGroup && (
        <PresentationMode
          group={presentationGroup}
          isOpen={isPresentationOpen}
          onClose={handlePresentationClose}
        />
      )}
    </div>
  );
}