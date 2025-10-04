/**
 * CanvasToolbar Component
 * Top toolbar with Save/Cancel buttons and template selection
 */

import { memo } from 'react';
import { Save, X, Undo, Redo } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import type { Template } from '../../TemplateManager';

interface CanvasToolbarProps {
  // Actions
  onSave: () => void;
  onCancel: () => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // Template
  currentTemplateId: string;
  onTemplateSelect: (template: Template, formatOnly: boolean) => void;

  // Optional
  isSaving?: boolean;
  unitName?: string;
}

function CanvasToolbar({
  onSave,
  onCancel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentTemplateId,
  onTemplateSelect,
  isSaving = false,
  unitName,
}: CanvasToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {unitName ? `Modifica: ${unitName}` : 'Nuova Unità Navale'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Editor visuale canvas - Trascina e ridimensiona gli elementi
          </p>
        </div>

        {/* Center: Undo/Redo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Annulla (Ctrl+Z)"
            aria-label="Annulla"
          >
            <Undo className="h-5 w-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Ripeti (Ctrl+Y)"
            aria-label="Ripeti"
          >
            <Redo className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <X className="h-4 w-4 inline-block mr-2" />
            Annulla
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 inline-block mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Template Selector Row */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <TemplateSelector
          currentTemplateId={currentTemplateId}
          onTemplateSelect={onTemplateSelect}
        />
      </div>
    </div>
  );
}

export default memo(CanvasToolbar);
