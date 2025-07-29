import React from 'react';
import { Undo, Redo, History, Grid, Magnet } from 'lucide-react';

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onShowHistory?: () => void;
  className?: string;
}

const UndoRedoToolbar: React.FC<UndoRedoToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  onShowHistory,
  className = ""
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Undo/Redo */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-2 transition-colors ${
            canUndo 
              ? 'bg-white hover:bg-gray-50 text-gray-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Annulla (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-3 py-2 transition-colors ${
            canRedo 
              ? 'bg-white hover:bg-gray-50 text-gray-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Ripeti (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Grid Toggle */}
      <button
        onClick={onToggleGrid}
        className={`px-3 py-2 border rounded-lg transition-colors ${
          showGrid
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title="Mostra/Nascondi Griglia"
      >
        <Grid className="h-4 w-4" />
      </button>

      {/* Snap Toggle */}
      <button
        onClick={onToggleSnap}
        className={`px-3 py-2 border rounded-lg transition-colors ${
          snapEnabled
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        title="Attiva/Disattiva Snap"
      >
        <Magnet className="h-4 w-4" />
      </button>

      {/* History */}
      {onShowHistory && (
        <button
          onClick={onShowHistory}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          title="Mostra Cronologia"
        >
          <History className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default UndoRedoToolbar;