import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { navalUnitsApi } from '../services/api';
import type { NavalUnit, CreateNavalUnitRequest, CreateCharacteristicRequest } from '../types/index.ts';
import { useToast } from '../contexts/ToastContext';

interface NavalUnitModalProps {
  unit?: NavalUnit | null;
  onClose: () => void;
  onSave: () => void;
}

export default function NavalUnitModal({ unit, onClose, onSave }: NavalUnitModalProps) {
  const { success, error: showError, warning, info } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    unit_class: '',
    nation: '',
    background_color: '#ffffff',
    silhouette_zoom: '100',
    silhouette_position_x: '50',
    silhouette_position_y: '50',
  });

  const [characteristics, setCharacteristics] = useState<CreateCharacteristicRequest[]>([
    { characteristic_name: '', characteristic_value: '', order_index: 0 }
  ]);

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || '',
        unit_class: unit.unit_class || '',
        nation: unit.nation || '',
        background_color: unit.background_color || '#ffffff',
        silhouette_zoom: unit.silhouette_zoom || '100',
        silhouette_position_x: unit.silhouette_position_x || '50',
        silhouette_position_y: unit.silhouette_position_y || '50',
      });
      
      if (unit.characteristics && unit.characteristics.length > 0) {
        setCharacteristics(
          unit.characteristics.map((char) => ({
            characteristic_name: char.characteristic_name,
            characteristic_value: char.characteristic_value,
            order_index: char.order_index,
          }))
        );
      }
    }
  }, [unit]);

  const createMutation = useMutation({
    mutationFn: navalUnitsApi.create,
    onSuccess: onSave,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateNavalUnitRequest> }) =>
      navalUnitsApi.update(id, data),
    onSuccess: onSave,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validCharacteristics = characteristics.filter(
      char => char.characteristic_name.trim() && char.characteristic_value.trim()
    );

    const requestData: CreateNavalUnitRequest = {
      ...formData,
      characteristics: validCharacteristics.map((char, index) => ({
        ...char,
        order_index: index,
      })),
    };

    try {
      if (unit) {
        await updateMutation.mutateAsync({ id: unit.id, data: requestData });
      } else {
        await createMutation.mutateAsync(requestData);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showError('Errore durante il salvataggio dell\'unità navale');
    }
  };

  const addCharacteristic = () => {
    setCharacteristics([
      ...characteristics,
      { characteristic_name: '', characteristic_value: '', order_index: characteristics.length }
    ]);
  };

  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const updateCharacteristic = (index: number, field: string, value: string) => {
    const updated = [...characteristics];
    updated[index] = { ...updated[index], [field]: value };
    setCharacteristics(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {unit ? 'Modifica Unità Navale' : 'Nuova Unità Navale'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Classe *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.unit_class}
                onChange={(e) => setFormData({ ...formData, unit_class: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazione
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.nation}
                onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colore di sfondo
              </label>
              <input
                type="color"
                className="input-field h-12"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Caratteristiche
              </h3>
              <button
                type="button"
                onClick={addCharacteristic}
                className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
              >
                + Aggiungi
              </button>
            </div>

            <div className="space-y-3">
              {characteristics.map((char, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Nome caratteristica"
                    className="input-field flex-1"
                    value={char.characteristic_name}
                    onChange={(e) => updateCharacteristic(index, 'characteristic_name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Valore"
                    className="input-field flex-1"
                    value={char.characteristic_value}
                    onChange={(e) => updateCharacteristic(index, 'characteristic_value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCharacteristic(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
                : unit
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