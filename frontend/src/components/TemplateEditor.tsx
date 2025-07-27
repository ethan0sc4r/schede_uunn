import React, { useState, useRef, useCallback } from 'react';
import { Save, Palette, Plus, X } from 'lucide-react';

interface TemplateElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'text' | 'table' | 'unit_name' | 'unit_class';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  image?: string;
  tableData?: string[][];
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    whiteSpace?: string;
    textAlign?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
  };
}

interface TemplateEditorProps {
  templateId?: string;
  onSave: (templateData: any) => void;
  onCancel: () => void;
}

const CANVAS_WIDTH = 1123; // A4 landscape at 96 DPI
const CANVAS_HEIGHT = 794;

export default function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>([
    // Default elements for a new template
    {
      id: 'unit_name',
      type: 'unit_name',
      x: 160,
      y: 30,
      width: 400,
      height: 40,
      content: 'NOME UNITA\' NAVALE: [Nome]',
      style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
    },
    {
      id: 'unit_class',
      type: 'unit_class',
      x: 160,
      y: 80,
      width: 400,
      height: 40,
      content: 'CLASSE UNITA\': [Classe]',
      style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
    },
    {
      id: 'logo',
      type: 'logo',
      x: 20,
      y: 20,
      width: 120,
      height: 120,
      style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
    },
    {
      id: 'flag',
      type: 'flag',
      x: CANVAS_WIDTH - 140,
      y: 20,
      width: 120,
      height: 80,
      style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
    },
    {
      id: 'silhouette',
      type: 'silhouette',
      x: 20,
      y: 180,
      width: CANVAS_WIDTH - 40,
      height: 300,
      style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
    },
    {
      id: 'characteristics-table',
      type: 'table',
      x: 20,
      y: 500,
      width: CANVAS_WIDTH - 40,
      height: 200,
      style: { backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' },
      tableData: [
        ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
        ['MOTORI', 'XXX', 'RADAR', 'XXX'],
        ['ARMA', 'XXX', 'MITRAGLIERA', 'XXX']
      ]
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  const handleCanvasClick = () => {
    setSelectedElement(null);
  };

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: Math.max(0, el.x + deltaX), y: Math.max(0, el.y + deltaY) }
        : el
    ));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedElement, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTextEdit = (elementId: string, newText: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content: newText } : el
    ));
  };

  const deleteElement = (elementId: string) => {
    // Don't allow deletion of unit_name and unit_class
    if (elementId === 'unit_name' || elementId === 'unit_class') return;
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Inserisci il nome del template');
      return;
    }

    const templateData = {
      id: templateId || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: elements,
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    onSave(templateData);
  };

  const renderElement = (element: TemplateElement) => {
    const isSelected = selectedElement === element.id;
    const isFixed = element.type === 'unit_name' || element.type === 'unit_class';
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isFixed ? 'ring-2 ring-yellow-400' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          backgroundColor: element.style?.backgroundColor,
          borderRadius: element.style?.borderRadius,
          borderWidth: element.style?.borderWidth || 0,
          borderColor: element.style?.borderColor || '#000000',
          borderStyle: element.style?.borderStyle || 'solid',
        }}
        onClick={(e) => handleElementClick(element.id, e)}
        onMouseDown={(e) => handleMouseDown(element.id, e)}
      >
        {/* Fixed fields indicator */}
        {isFixed && (
          <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
            Campo Fisso
          </div>
        )}

        {/* Content based on element type */}
        {(element.type === 'text' || element.type === 'unit_name' || element.type === 'unit_class') && (
          <div
            className="w-full h-full flex items-center justify-start px-2 cursor-move"
            style={{
              fontSize: element.style?.fontSize,
              fontWeight: element.style?.fontWeight,
              color: element.style?.color,
              whiteSpace: element.style?.whiteSpace as any,
            }}
          >
            {isSelected ? (
              <textarea
                value={element.content || ''}
                onChange={(e) => handleTextEdit(element.id, e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{
                  fontSize: element.style?.fontSize,
                  fontWeight: element.style?.fontWeight,
                  color: element.style?.color,
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div style={{ whiteSpace: 'pre-line' }}>{element.content}</div>
            )}
          </div>
        )}

        {(element.type === 'logo' || element.type === 'silhouette') && (
          <div className="w-full h-full flex items-center justify-center cursor-move">
            <div className="text-gray-600 text-center text-sm font-bold">
              {element.type === 'logo' && 'LOGO'}
              {element.type === 'silhouette' && 'SILHOUETTE NAVE'}
            </div>
          </div>
        )}

        {element.type === 'flag' && (
          <div className="w-full h-full flex items-center justify-center cursor-move">
            <div className="text-gray-600 text-center text-sm font-bold">BANDIERA</div>
          </div>
        )}

        {element.type === 'table' && (
          <div className="w-full h-full bg-white border border-gray-400 cursor-move overflow-auto">
            <div className="p-2">
              <div className="text-xs font-bold mb-2">CARATTERISTICHE</div>
              <div className="text-xs">
                {element.tableData?.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex border-b border-gray-300">
                    {row.map((cell, colIndex) => {
                      const isHeader = rowIndex === 0;
                      const bgColor = colIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white';
                      
                      return (
                        <div
                          key={colIndex}
                          className={`flex-1 p-2 border-r border-gray-300 ${bgColor} ${isHeader ? 'font-medium' : ''}`}
                        >
                          <span>{cell}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resize handles for selected element */}
        {isSelected && !isFixed && (
          <>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize" />
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize" />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Tools */}
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Editor Template</h2>
          
          {/* Template Info */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es. Template Standard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Breve descrizione del template..."
              />
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              Salva
            </button>
          </div>
        </div>

        {selectedElement && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Proprietà Elemento</h3>
            {(() => {
              const element = elements.find(el => el.id === selectedElement);
              if (!element) return null;

              const isFixed = element.type === 'unit_name' || element.type === 'unit_class';

              return (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <div className="text-sm text-gray-600 capitalize">{element.type.replace('_', ' ')}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                      <input
                        type="number"
                        value={element.x}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement ? { ...el, x: parseInt(e.target.value) || 0 } : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                      <input
                        type="number"
                        value={element.y}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement ? { ...el, y: parseInt(e.target.value) || 0 } : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Larghezza</label>
                      <input
                        type="number"
                        value={element.width}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement ? { ...el, width: parseInt(e.target.value) || 0 } : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Altezza</label>
                      <input
                        type="number"
                        value={element.height}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement ? { ...el, height: parseInt(e.target.value) || 0 } : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {!isFixed && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => deleteElement(element.id)}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        🗑️ Elimina Elemento
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Aggiungi Elementi</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                const newElement: TemplateElement = {
                  id: `text-${Date.now()}`,
                  type: 'text',
                  x: 100,
                  y: 100,
                  width: 200,
                  height: 30,
                  content: 'Nuovo testo',
                  style: { fontSize: 16, color: '#000' }
                };
                setElements(prev => [...prev, newElement]);
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              + Aggiungi Testo
            </button>
            <button
              onClick={() => {
                const newElement: TemplateElement = {
                  id: `logo-${Date.now()}`,
                  type: 'logo',
                  x: 50,
                  y: 50,
                  width: 100,
                  height: 100,
                  style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
                };
                setElements(prev => [...prev, newElement]);
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              + Aggiungi Logo
            </button>
            <button
              onClick={() => {
                const newElement: TemplateElement = {
                  id: `flag-${Date.now()}`,
                  type: 'flag',
                  x: 200,
                  y: 50,
                  width: 100,
                  height: 60,
                  style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
                };
                setElements(prev => [...prev, newElement]);
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              + Aggiungi Bandiera
            </button>
            <button
              onClick={() => {
                const newElement: TemplateElement = {
                  id: `table-${Date.now()}`,
                  type: 'table',
                  x: 100,
                  y: 400,
                  width: 400,
                  height: 150,
                  style: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' },
                  tableData: [
                    ['CARATTERISTICA', 'VALORE'],
                    ['Nuovo campo', 'Nuovo valore']
                  ]
                };
                setElements(prev => [...prev, newElement]);
              }}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              + Aggiungi Tabella
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-gray-300"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onClick={handleCanvasClick}
          >
            {elements.map(renderElement)}
            
            {/* Canvas grid for alignment */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}