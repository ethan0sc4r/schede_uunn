/**
 * PropertiesPanel Component
 * Right sidebar panel for editing selected element properties
 */

import { memo, useCallback } from 'react';
import { Trash2, Copy, Eye, EyeOff, MoveUp, MoveDown } from 'lucide-react';
import type { CanvasElement } from '../utils/canvasTypes';

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onElementUpdate: (updates: Partial<CanvasElement>) => void;
  onElementDelete: () => void;
  onElementDuplicate: () => void;
  onToggleVisibility: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

function PropertiesPanel({
  selectedElement,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onToggleVisibility,
  onBringToFront,
  onSendToBack,
}: PropertiesPanelProps) {
  const handleStyleUpdate = useCallback(
    (styleUpdates: Partial<CanvasElement['style']>) => {
      onElementUpdate({
        style: {
          ...selectedElement?.style,
          ...styleUpdates,
        },
      });
    },
    [selectedElement, onElementUpdate]
  );

  const handleTableDataUpdate = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      if (!selectedElement?.tableData) return;

      const newTableData = selectedElement.tableData.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
          : row
      );

      onElementUpdate({ tableData: newTableData });
    },
    [selectedElement, onElementUpdate]
  );

  if (!selectedElement) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-sm">Nessun elemento selezionato</p>
            <p className="text-xs mt-2">
              Clicca su un elemento nel canvas per modificarne le proprietà
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Proprietà Elemento
      </h3>

      {/* Element Type Badge */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Tipo</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {selectedElement.type}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          ID: {selectedElement.id.substring(0, 12)}...
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={onElementDuplicate}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <Copy className="h-3 w-3" />
          Duplica
        </button>
        <button
          onClick={onToggleVisibility}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          {selectedElement.visible !== false ? (
            <>
              <EyeOff className="h-3 w-3" />
              Nascondi
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Mostra
            </>
          )}
        </button>
        <button
          onClick={onBringToFront}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <MoveUp className="h-3 w-3" />
          Porta Sopra
        </button>
        <button
          onClick={onSendToBack}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <MoveDown className="h-3 w-3" />
          Porta Sotto
        </button>
        <button
          onClick={onElementDelete}
          className="col-span-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium flex items-center justify-center gap-2"
        >
          <Trash2 className="h-3 w-3" />
          Elimina
        </button>
      </div>

      {/* Position & Size */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
        <h4 className="text-xs font-semibold text-gray-700">Posizione e Dimensioni</h4>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">X</label>
            <input
              type="number"
              value={Math.round(selectedElement.x)}
              onChange={(e) => onElementUpdate({ x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(selectedElement.y)}
              onChange={(e) => onElementUpdate({ y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Larghezza</label>
            <input
              type="number"
              value={Math.round(selectedElement.width)}
              onChange={(e) => onElementUpdate({ width: Number(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Altezza</label>
            <input
              type="number"
              value={Math.round(selectedElement.height)}
              onChange={(e) => onElementUpdate({ height: Number(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Text Content - for text, unit_name, unit_class */}
      {(selectedElement.type === 'text' ||
        selectedElement.type === 'unit_name' ||
        selectedElement.type === 'unit_class') && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700">Contenuto</h4>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Testo</label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => onElementUpdate({ content: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Text Styling */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dimensione</label>
              <input
                type="number"
                value={selectedElement.style?.fontSize || 16}
                onChange={(e) =>
                  handleStyleUpdate({ fontSize: Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Colore</label>
              <input
                type="color"
                value={selectedElement.style?.color || '#000000'}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sfondo</label>
              <input
                type="color"
                value={selectedElement.style?.backgroundColor || '#ffffff'}
                onChange={(e) =>
                  handleStyleUpdate({ backgroundColor: e.target.value })
                }
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Allineamento</label>
              <select
                value={selectedElement.style?.textAlign || 'left'}
                onChange={(e) =>
                  handleStyleUpdate({
                    textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify',
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="left">Sinistra</option>
                <option value="center">Centro</option>
                <option value="right">Destra</option>
                <option value="justify">Giustificato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Peso</label>
              <select
                value={selectedElement.style?.fontWeight || 'normal'}
                onChange={(e) => handleStyleUpdate({ fontWeight: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Normale</option>
                <option value="bold">Grassetto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Stile</label>
              <select
                value={selectedElement.style?.fontStyle || 'normal'}
                onChange={(e) => handleStyleUpdate({ fontStyle: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Normale</option>
                <option value="italic">Corsivo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table Data */}
      {selectedElement.type === 'table' && selectedElement.tableData && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700">Dati Tabella</h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedElement.tableData.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-2 gap-2">
                {row.map((cell, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    value={cell}
                    onChange={(e) =>
                      handleTableDataUpdate(rowIndex, colIndex, e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`R${rowIndex + 1}C${colIndex + 1}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Border & Background */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
        <h4 className="text-xs font-semibold text-gray-700">Bordi e Sfondi</h4>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Spessore Bordo</label>
            <input
              type="number"
              value={selectedElement.style?.borderWidth || 0}
              onChange={(e) =>
                handleStyleUpdate({ borderWidth: Number(e.target.value) })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Colore Bordo</label>
            <input
              type="color"
              value={selectedElement.style?.borderColor || '#000000'}
              onChange={(e) => handleStyleUpdate({ borderColor: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Arrotondamento</label>
            <input
              type="number"
              value={selectedElement.style?.borderRadius || 0}
              onChange={(e) =>
                handleStyleUpdate({ borderRadius: Number(e.target.value) })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PropertiesPanel);
