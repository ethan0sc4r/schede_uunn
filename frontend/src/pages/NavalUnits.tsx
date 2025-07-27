import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ship } from 'lucide-react';
import { navalUnitsApi } from '../services/api';
import type { NavalUnit } from '../types/index.ts';
import NavalUnitCard from '../components/NavalUnitCard';
import CanvasEditor from '../components/CanvasEditor';

export default function NavalUnits() {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<NavalUnit | null>(null);
  const queryClient = useQueryClient();

  const { data: navalUnits, isLoading, error } = useQuery({
    queryKey: ['navalUnits'],
    queryFn: () => navalUnitsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: navalUnitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navalUnits'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: navalUnitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navalUnits'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) => navalUnitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navalUnits'] });
    },
  });

  const handleCreate = () => {
    setSelectedUnit(null);
    setShowEditor(true);
  };

  const handleEdit = (unit: NavalUnit) => {
    setSelectedUnit(unit);
    setShowEditor(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa unità navale?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        alert('Errore durante l\'eliminazione dell\'unità navale');
      }
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedUnit(null);
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
          Errore nel caricamento delle unità navali
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-gray-900">Unità Navali</h1>
            <p className="text-gray-600 mt-1">Gestisci le tue schede unità navali</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
          >
            + Nuova Unità
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          {!navalUnits || navalUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="text-center">
                <Ship className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Nessuna unità navale
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Inizia creando la tua prima scheda unità navale utilizzando il nostro editor visuale.
                </p>
                <button
                  onClick={handleCreate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Crea la prima unità navale
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {navalUnits.map((unit) => (
                <NavalUnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={() => handleEdit(unit)}
                  onDelete={() => handleDelete(unit.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-white z-50">
          <CanvasEditor
            unit={selectedUnit}
            onSave={async (canvasData) => {
              try {
                console.log('Saving canvas data:', canvasData);
                
                // Extract unit name and class from canvas elements
                const unitNameElement = canvasData.elements?.find((el: any) => el.type === 'unit_name');
                const unitClassElement = canvasData.elements?.find((el: any) => el.type === 'unit_class');
                
                // Extract values from content
                const unitName = unitNameElement?.content?.replace(/^NOME UNITA' NAVALE:\s*/, '') || 'Nuova Unità';
                const unitClass = unitClassElement?.content?.replace(/^CLASSE UNITA':\s*/, '') || 'Nuova Classe';
                
                const unitData = {
                  name: unitName,
                  unit_class: unitClass,
                  nation: selectedUnit?.nation || '',
                  layout_config: {
                    elements: canvasData.elements,
                    canvasBackground: canvasData.canvasBackground,
                    canvasBorderWidth: canvasData.canvasBorderWidth,
                    canvasBorderColor: canvasData.canvasBorderColor
                  },
                  characteristics: selectedUnit?.characteristics || []
                };

                if (selectedUnit) {
                  // Update existing unit
                  await updateMutation.mutateAsync({ 
                    id: selectedUnit.id, 
                    data: unitData 
                  });
                } else {
                  // Create new unit
                  await createMutation.mutateAsync(unitData);
                }
                
                handleEditorClose();
              } catch (error) {
                console.error('Errore durante il salvataggio:', error);
                alert('Errore durante il salvataggio della scheda');
              }
            }}
            onCancel={handleEditorClose}
          />
        </div>
      )}
    </div>
  );
}