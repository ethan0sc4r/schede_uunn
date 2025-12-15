import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { useIdentificationAutocomplete } from '../hooks/useIdentificationAutocomplete';
import {
  parseNotesField,
  serializeNavalData,
  addElementToDictionary,
  generateElementId,
  type IdentificationElement,
  type NavalData
} from '../utils/identificationStorage';

interface ShipIdentificationEditorProps {
  unit: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}

export default function ShipIdentificationEditor({ unit, isOpen, onClose, onSave }: ShipIdentificationEditorProps) {
  const [navalData, setNavalData] = useState<NavalData>(() => parseNotesField(unit?.notes));
  const [newElement, setNewElement] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const { suggestions, clearSuggestions } = useIdentificationAutocomplete(newElement, showSuggestions);

  useEffect(() => {
    if (isOpen && unit?.notes !== undefined) {
      setNavalData(parseNotesField(unit.notes));
      setNewElement('');
      setEditingId(null);
      clearSuggestions();
    }
  }, [isOpen, unit?.notes, clearSuggestions]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  if (!isOpen) return null;

  const handleAddElement = () => {
    const element = newElement.trim();
    if (!element) return;

    const newIdentificationElement: IdentificationElement = {
      id: generateElementId(),
      element: element
    };

    setNavalData(prev => ({
      ...prev,
      identification: [...(prev.identification || []), newIdentificationElement]
    }));

    // Add to dictionary for autocomplete
    addElementToDictionary(element);

    setNewElement('');
    clearSuggestions();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleDeleteElement = (id: string) => {
    setNavalData(prev => ({
      ...prev,
      identification: (prev.identification || []).filter(item => item.id !== id)
    }));
  };

  const handleEditElement = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditingValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const element = editingValue.trim();
    if (!element) {
      handleCancelEdit();
      return;
    }

    setNavalData(prev => ({
      ...prev,
      identification: (prev.identification || []).map(item =>
        item.id === editingId ? { ...item, element } : item
      )
    }));

    // Add to dictionary
    addElementToDictionary(element);

    setEditingId(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleSave = () => {
    const serialized = serializeNavalData(navalData);
    onSave(serialized);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddElement();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewElement(suggestion);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...(navalData.identification || [])];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setNavalData(prev => ({ ...prev, identification: items }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const identification = navalData.identification || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Ship Identification - {unit?.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              From Bow to Stern (Prora → Poppa)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              From Bow to Stern (Prora → Poppa)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              List identifying features as you see them from bow (front) to stern (back)
            </p>

            {/* Elements List */}
            {identification.length > 0 ? (
              <div className="space-y-2 mb-6">
                {identification.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-shrink-0 w-8 text-sm font-medium text-gray-500">
                      {index + 1}.
                    </div>
                    {editingId === item.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={handleEditKeyPress}
                        onBlur={handleSaveEdit}
                        className="flex-1 px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 text-gray-900">{item.element}</div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditElement(item.id, item.element)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteElement(item.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
                <p className="text-gray-500 text-sm">
                  No elements added yet. Start adding identification features below.
                </p>
              </div>
            )}

            {/* Add New Element */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add new element:
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newElement}
                  onChange={(e) => setNewElement(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g., Cannon 127mm, Bridge, Mast, Funnel..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs text-gray-600 font-medium">💡 Suggestions:</p>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.element)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-900">{suggestion.element}</span>
                        <span className="text-xs text-gray-500">used {suggestion.count}x</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddElement}
                disabled={!newElement.trim()}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Element
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              <strong>💡 Tip:</strong> Drag and drop elements to reorder them. Elements are automatically saved from bow to stern.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {identification.length} element{identification.length !== 1 ? 's' : ''} added
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Identification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
