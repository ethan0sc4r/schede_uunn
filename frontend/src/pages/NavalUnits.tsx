import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ship, Search, Grid, List, Eye, Edit3, Trash2, FileText } from 'lucide-react';
import { navalUnitsApi } from '../services/api';
import type { NavalUnit } from '../types/index.ts';
import NavalUnitCard from '../components/NavalUnitCard';
import CanvasEditor from '../components/CanvasEditor';
import NotesEditor from '../components/NotesEditor';
import { getImageUrl, migrateLayoutConfigImages } from '../utils/imageUtils';

export default function NavalUnits() {
  const [showEditor, setShowEditor] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<NavalUnit | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: navalUnits, isLoading, error } = useQuery({
    queryKey: ['navalUnits'],
    queryFn: () => navalUnitsApi.getAll(),
  });

  // Filter units based on search term
  const filteredUnits = useMemo(() => {
    if (!navalUnits || !searchTerm) return navalUnits || [];
    
    return navalUnits.filter((unit) =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.unit_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.nation && unit.nation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [navalUnits, searchTerm]);

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
    console.log('🔍 NavalUnits handleEdit called with unit:', unit);
    console.log('🔍 Unit layout_config:', unit.layout_config);
    console.log('🔍 Unit layout_config elements:', unit.layout_config?.elements);
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

  const handleEditNotes = (unit: NavalUnit) => {
    setSelectedUnit(unit);
    setShowNotesEditor(true);
  };

  const handleNotesEditorClose = () => {
    setShowNotesEditor(false);
    setSelectedUnit(null);
  };

  const handleSaveNotes = async (notes: string) => {
    if (!selectedUnit) return;
    
    try {
      await updateMutation.mutateAsync({
        id: selectedUnit.id,
        data: { notes }
      });
      console.log('Note salvate con successo');
    } catch (error) {
      console.error('Errore salvando le note:', error);
      alert('Errore durante il salvataggio delle note');
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
          Errore nel caricamento delle unità navali
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center mb-6">
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
        
        {/* Search and View Controls */}
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cerca per nome, classe o nazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Vista:</span>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
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
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Nessun risultato trovato
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Prova a modificare i termini di ricerca o rimuovi i filtri.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancella ricerca
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUnits.map((unit) => (
                <NavalUnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={() => handleEdit(unit)}
                  onDelete={() => handleDelete(unit.id)}
                  onEditNotes={() => handleEditNotes(unit)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unità
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nazione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creato da
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {(() => {
                              const silhouetteElement = unit.layout_config?.elements?.find((el: any) => el.type === 'silhouette');
                              const silhouetteImage = silhouetteElement?.image;
                              
                              if (silhouetteImage) {
                                return (
                                  <img
                                    src={getImageUrl(silhouetteImage)}
                                    alt={`${unit.name} silhouette`}
                                    className="h-10 w-10 object-contain"
                                  />
                                );
                              } else {
                                return (
                                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                    <Ship className="h-6 w-6 text-gray-400" />
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{unit.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unit.unit_class}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unit.nation || 'Non specificata'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unit.creator 
                          ? `${unit.creator.first_name} ${unit.creator.last_name}`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.template_name && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {unit.template_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => window.open(`/units/${unit.id}/view`, '_blank')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Visualizza"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(unit)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifica"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditNotes(unit)}
                            className="text-green-600 hover:text-green-900"
                            title="Note"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(unit.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                console.log('🔍 Saving canvas data:', canvasData);
                
                // Convert any base64 images to backend files
                const migratedLayoutConfig = await migrateLayoutConfigImages({
                  elements: canvasData.elements,
                  canvasBackground: canvasData.canvasBackground,
                  canvasBorderWidth: canvasData.canvasBorderWidth,
                  canvasBorderColor: canvasData.canvasBorderColor
                });
                
                console.log('🔍 Migrated layout config:', migratedLayoutConfig);
                
                // Extract unit name and class from canvas elements
                const unitNameElement = migratedLayoutConfig.elements?.find((el: any) => el.type === 'unit_name');
                const unitClassElement = migratedLayoutConfig.elements?.find((el: any) => el.type === 'unit_class');
                
                // Extract values from content
                const unitName = unitNameElement?.content || 'Nuova Unità';
                const unitClass = unitClassElement?.content || 'Nuova Classe';
                
                const unitData = {
                  name: unitName,
                  unit_class: unitClass,
                  nation: canvasData.nation || selectedUnit?.nation || '',
                  layout_config: migratedLayoutConfig,
                  characteristics: selectedUnit?.characteristics || []
                };
                
                console.log('🔍 Final unit data being sent:', unitData);

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
                
                // Force refresh the query cache to show updated images
                await queryClient.invalidateQueries({ queryKey: ['navalUnits'] });
                
                // If we're editing an existing unit, fetch the updated unit data for the editor
                if (selectedUnit) {
                  try {
                    const updatedUnit = await navalUnitsApi.getById(selectedUnit.id);
                    setSelectedUnit(updatedUnit);
                    console.log('✅ Selected unit updated with fresh data from server');
                  } catch (error) {
                    console.error('❌ Error fetching updated unit data:', error);
                  }
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

      {/* Notes Editor */}
      <NotesEditor
        unit={selectedUnit}
        isOpen={showNotesEditor}
        onClose={handleNotesEditorClose}
        onSave={handleSaveNotes}
      />
    </div>
  );
}