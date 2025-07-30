import React, { useState, useMemo } from 'react';
import { X, Search, Upload, Save, Grid, Clock, Settings } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'basic' | 'ordering' | 'template' | 'presentation'>('basic');
  
  // Drag and drop for ordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  // Drag and drop handlers for ordering
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
            onClick={() => setActiveTab('ordering')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ordering'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="h-4 w-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
            Ordine
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

          {activeTab === 'ordering' && (
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Ordine di Presentazione</h3>
                  <p className="text-sm text-blue-700">
                    Definisci l'ordine in cui le unità navali verranno presentate durante la presentazione del gruppo.
                  </p>
                </div>

                {selectedUnitIds.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna unità selezionata</h3>
                    <p className="text-gray-600">
                      Vai alla tab "Informazioni Base" per selezionare le unità navali da includere nel gruppo.
                    </p>
                    <button
                      onClick={() => setActiveTab('basic')}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Seleziona Unità
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center text-sm text-green-800">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>
                          <strong>{selectedUnitIds.length} unità selezionate</strong> - Le slide verranno mostrate nell'ordine: #{selectedUnitIds.map((_, i) => i + 1).join(' → #')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-800">
                          <strong>Come riordinare:</strong>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Trascina le unità per spostarle</li>
                            <li>Usa le frecce ↑↓ per spostamenti precisi</li>
                            <li>Clicca ✕ per rimuovere un'unità dal gruppo</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
                            className={`flex items-center justify-between p-4 bg-white border-2 border-blue-200 rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                              draggedIndex === index ? 'opacity-50 scale-95 bg-blue-100 shadow-lg' : ''
                            }`}
                            style={{ userSelect: 'none' }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white text-lg font-bold rounded-full shadow-sm">
                                {index + 1}
                              </div>
                              <div className="cursor-move text-gray-400 hover:text-blue-600 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z"></path>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-lg text-gray-900">{unit.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">{unit.unit_class}</span>
                                  {unit.nation && (
                                    <>
                                      <span className="mx-2 text-gray-400">•</span>
                                      <span>{unit.nation}</span>
                                    </>
                                  )}
                                  {unit.creator && (
                                    <>
                                      <span className="mx-2 text-gray-400">•</span>
                                      <span className="text-gray-500">
                                        {unit.creator.first_name} {unit.creator.last_name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => moveUnit(index, 'up')}
                                disabled={index === 0}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-colors"
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
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-colors"
                                title="Sposta giù"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnitToggle(unitId)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                  </div>
                )}
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