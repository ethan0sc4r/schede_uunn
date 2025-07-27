import React, { useState, useMemo } from 'react';
import { X, Search, Upload, Save, Plus, Grid, Clock, Settings } from 'lucide-react';
import type { Group, NavalUnit, PresentationConfig, CreateGroupRequest } from '../types/index.ts';

interface GroupModalAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupData: CreateGroupRequest) => void;
  group?: Group | null;
  availableUnits: NavalUnit[];
  availableGroups: Group[]; // For parent group selection
}

export default function GroupModalAdvanced({
  isOpen,
  onClose,
  onSave,
  group,
  availableUnits,
  availableGroups
}: GroupModalAdvancedProps) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [parentGroupId, setParentGroupId] = useState<number | null>(group?.parent_group_id || null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>(
    group?.naval_units.map(u => u.id) || []
  );
  
  // Template settings
  const [templateLogoPath, setTemplateLogoPath] = useState(group?.template_logo_path || '');
  const [templateFlagPath, setTemplateFlagPath] = useState(group?.template_flag_path || '');
  const [overrideLogo, setOverrideLogo] = useState(group?.override_logo || false);
  const [overrideFlag, setOverrideFlag] = useState(group?.override_flag || false);
  
  // Presentation settings
  const [presentationConfig, setPresentationConfig] = useState<PresentationConfig>(
    group?.presentation_config || {
      mode: 'single',
      interval: 5,
      grid_rows: 3,
      grid_cols: 3,
      auto_advance: true,
      page_duration: 10
    }
  );
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'template' | 'presentation'>('basic');

  const filteredUnits = useMemo(() => {
    if (!searchTerm) return availableUnits;
    return availableUnits.filter(unit =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.unit_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.nation && unit.nation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (unit.creator && 
        `${unit.creator.first_name} ${unit.creator.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [availableUnits, searchTerm]);

  // Filter available parent groups (exclude current group and its descendants)
  const availableParentGroups = useMemo(() => {
    if (!group) return availableGroups;
    return availableGroups.filter(g => g.id !== group.id);
  }, [availableGroups, group]);

  const handleUnitToggle = (unitId: number) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleSave = () => {
    const groupData: CreateGroupRequest = {
      name,
      description: description || undefined,
      parent_group_id: parentGroupId || undefined,
      naval_unit_ids: selectedUnitIds,
      template_logo_path: templateLogoPath || undefined,
      template_flag_path: templateFlagPath || undefined,
      override_logo: overrideLogo,
      override_flag: overrideFlag,
      presentation_config: presentationConfig
    };
    onSave(groupData);
  };

  const handleTemplateLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/upload-image`, { method: 'POST', body: formData });
    const data = await response.json();
    setTemplateLogoPath(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/static/${data.file_path}`);
  };

  const handleTemplateFlagUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/upload-image`, { method: 'POST', body: formData });
    const data = await response.json();
    setTemplateFlagPath(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/static/${data.file_path}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {group ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            Informazioni Base
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'template'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-4 w-4 mr-2 inline" />
            Template Override
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'presentation'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid className="h-4 w-4 mr-2 inline" />
            Modalità Presentazione
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'basic' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Group Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Gruppo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Inserisci nome del gruppo..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrizione del gruppo..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gruppo Genitore (Sottogruppo)
                    </label>
                    <select
                      value={parentGroupId || ''}
                      onChange={(e) => setParentGroupId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Nessun gruppo genitore</option>
                      {availableParentGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Unità Selezionate: {selectedUnitIds.length}
                    </h4>
                    <div className="text-sm text-blue-700">
                      {selectedUnitIds.length === 0 
                        ? 'Nessuna unità selezionata'
                        : `${selectedUnitIds.length} unità navali nel gruppo`
                      }
                    </div>
                  </div>
                </div>

                {/* Right Column - Units Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cerca e Seleziona Unità Navali
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cerca per nome, classe, nazione o creatore..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    {filteredUnits.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? 'Nessuna unità trovata' : 'Nessuna unità disponibile'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredUnits.map(unit => (
                          <div
                            key={unit.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleUnitToggle(unit.id)}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedUnitIds.includes(unit.id)}
                                onChange={() => handleUnitToggle(unit.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {unit.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {unit.unit_class} • {unit.nation || 'Non specificata'}
                                    </div>
                                  </div>
                                  {unit.creator && (
                                    <div className="text-xs text-gray-400">
                                      {unit.creator.first_name} {unit.creator.last_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-900 mb-2">Template Override</h3>
                  <p className="text-sm text-yellow-700">
                    Configura logo e bandiera che sovrascriveranno quelli delle singole unità durante la presentazione del gruppo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Template */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="override-logo"
                        checked={overrideLogo}
                        onChange={(e) => setOverrideLogo(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="override-logo" className="text-sm font-medium text-gray-700">
                        Sovrascrivi Logo
                      </label>
                    </div>

                    {overrideLogo && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Template Logo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {templateLogoPath ? (
                            <div className="space-y-2">
                              <img
                                src={templateLogoPath}
                                alt="Template Logo"
                                className="h-20 w-20 object-contain mx-auto"
                              />
                              <button
                                onClick={() => setTemplateLogoPath('')}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Rimuovi
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleTemplateLogoUpload(e.target.files[0])}
                                className="w-full text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flag Template */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="override-flag"
                        checked={overrideFlag}
                        onChange={(e) => setOverrideFlag(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="override-flag" className="text-sm font-medium text-gray-700">
                        Sovrascrivi Bandiera
                      </label>
                    </div>

                    {overrideFlag && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Template Bandiera
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {templateFlagPath ? (
                            <div className="space-y-2">
                              <img
                                src={templateFlagPath}
                                alt="Template Flag"
                                className="h-12 w-20 object-contain mx-auto"
                              />
                              <button
                                onClick={() => setTemplateFlagPath('')}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Rimuovi
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleTemplateFlagUpload(e.target.files[0])}
                                className="w-full text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presentation' && (
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Modalità Presentazione</h3>
                  <p className="text-sm text-blue-700">
                    Configura come verranno presentate le unità navali del gruppo.
                  </p>
                </div>

                {/* Presentation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Modalità di Presentazione
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="single-mode"
                        name="presentation-mode"
                        value="single"
                        checked={presentationConfig.mode === 'single'}
                        onChange={(e) => setPresentationConfig(prev => ({ ...prev, mode: e.target.value as 'single' | 'grid' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="single-mode" className="ml-3 block text-sm text-gray-700">
                        <span className="font-medium">Modalità Singola</span>
                        <span className="block text-gray-500">Una unità alla volta con intervallo automatico</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="grid-mode"
                        name="presentation-mode"
                        value="grid"
                        checked={presentationConfig.mode === 'grid'}
                        onChange={(e) => setPresentationConfig(prev => ({ ...prev, mode: e.target.value as 'single' | 'grid' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="grid-mode" className="ml-3 block text-sm text-gray-700">
                        <span className="font-medium">Modalità Griglia</span>
                        <span className="block text-gray-500">Griglia di unità con paginazione automatica</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Single Mode Settings */}
                {presentationConfig.mode === 'single' && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Impostazioni Modalità Singola</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervallo tra unità (secondi)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={presentationConfig.interval || 5}
                        onChange={(e) => setPresentationConfig(prev => ({ 
                          ...prev, 
                          interval: parseInt(e.target.value) || 5 
                        }))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Grid Mode Settings */}
                {presentationConfig.mode === 'grid' && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Impostazioni Modalità Griglia</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Righe
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={presentationConfig.grid_rows || 3}
                          onChange={(e) => setPresentationConfig(prev => ({ 
                            ...prev, 
                            grid_rows: parseInt(e.target.value) || 3 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Colonne
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={presentationConfig.grid_cols || 3}
                          onChange={(e) => setPresentationConfig(prev => ({ 
                            ...prev, 
                            grid_cols: parseInt(e.target.value) || 3 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-advance"
                        checked={presentationConfig.auto_advance || false}
                        onChange={(e) => setPresentationConfig(prev => ({ 
                          ...prev, 
                          auto_advance: e.target.checked 
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto-advance" className="text-sm text-gray-700">
                        Avanzamento automatico delle pagine
                      </label>
                    </div>
                    {presentationConfig.auto_advance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durata pagina (secondi)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={presentationConfig.page_duration || 10}
                          onChange={(e) => setPresentationConfig(prev => ({ 
                            ...prev, 
                            page_duration: parseInt(e.target.value) || 10 
                          }))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedUnitIds.length} unità navali selezionate
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || selectedUnitIds.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {group ? 'Aggiorna Gruppo' : 'Crea Gruppo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}