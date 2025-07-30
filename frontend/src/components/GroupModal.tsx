import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { groupsApi, navalUnitsApi } from '../services/api';
import type { Group, CreateGroupRequest } from '../types/index.ts';

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newOrder = [...selectedUnitIds];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setSelectedUnitIds(newOrder);
    setDraggedIndex(null);
  };

  const moveUnit = (fromIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...selectedUnitIds];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= newOrder.length) return;
    
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setSelectedUnitIds(newOrder);
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
            
            {/* Selected Units with Drag & Drop Ordering */}
            {selectedUnitIds.length > 0 && availableUnits && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                  Ordine di presentazione ({selectedUnitIds.length} unità)
                </h3>
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  💡 <strong>Suggerimento:</strong> Trascina le unità per riordinarle o usa le frecce. L'ordine qui determina la sequenza di presentazione delle slide.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                  {selectedUnitIds.map((unitId, index) => {
                    const unit = availableUnits.find(u => u.id === unitId);
                    if (!unit) return null;
                    
                    return (
                      <div
                        key={unitId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center justify-between p-3 bg-white border-2 border-blue-200 rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm ${
                          draggedIndex === index ? 'opacity-50 scale-95 bg-blue-100' : ''
                        }`}
                        style={{ userSelect: 'none' }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                            {index + 1}
                          </div>
                          <div className="cursor-move text-gray-500 hover:text-blue-600 transition-colors">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z"></path>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{unit.name}</div>
                            <div className="text-sm text-gray-600">
                              {unit.unit_class}
                              {unit.nation && ` • ${unit.nation}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => moveUnit(index, 'up')}
                            disabled={index === 0}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                            title="Sposta su"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveUnit(index, 'down')}
                            disabled={index === selectedUnitIds.length - 1}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                            title="Sposta giù"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnitToggle(unitId)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            title="Rimuovi dal gruppo"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-sm text-green-800">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <strong>Ordine di presentazione impostato!</strong> Le slide verranno mostrate nella sequenza: #{selectedUnitIds.map((_, i) => i + 1).join(' → #')}
                    </span>
                  </div>
                </div>
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