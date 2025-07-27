import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { groupsApi, navalUnitsApi } from '../services/api';
import type { Group, CreateGroupRequest, NavalUnit } from '../types/index.ts';

interface GroupModalProps {
  group?: Group | null;
  onClose: () => void;
  onSave: () => void;
}

export default function GroupModal({ group, onClose, onSave }: GroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);

  const { data: availableUnits } = useQuery({
    queryKey: ['navalUnits'],
    queryFn: () => navalUnitsApi.getAll(),
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
      });
      
      if (group.naval_units) {
        setSelectedUnitIds(group.naval_units.map(unit => unit.id));
      }
    }
  }, [group]);

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: onSave,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateGroupRequest> }) =>
      groupsApi.update(id, data),
    onSuccess: onSave,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData: CreateGroupRequest = {
      ...formData,
      naval_unit_ids: selectedUnitIds,
    };

    try {
      if (group) {
        await updateMutation.mutateAsync({ id: group.id, data: requestData });
      } else {
        await createMutation.mutateAsync(requestData);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      alert('Errore durante il salvataggio del gruppo');
    }
  };

  const handleUnitToggle = (unitId: number) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {group ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Unità Navali
            </label>
            
            {!availableUnits || availableUnits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nessuna unità navale disponibile. 
                <br />
                Crea prima delle unità navali per aggiungerle ai gruppi.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {availableUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedUnitIds.includes(unit.id)}
                      onChange={() => handleUnitToggle(unit.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{unit.name}</div>
                      <div className="text-sm text-gray-600">
                        {unit.unit_class}
                        {unit.nation && ` • ${unit.nation}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            {selectedUnitIds.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedUnitIds.length} unità selezionate
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvataggio...'
                : group
                ? 'Aggiorna'
                : 'Crea'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}