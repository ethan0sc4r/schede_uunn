import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Save, Palette, Plus, X, Move, RotateCcw } from 'lucide-react';
import { templatesApi } from '../services/api';

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

// Caratteristiche table come elemento fisso
const FIXED_CHARACTERISTICS_TABLE = {
  id: 'characteristics-table',
  type: 'table',
  x: 20,
  y: 500,
  width: 1083,
  height: 200,
  isFixed: true,
  style: { backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' },
  tableData: [
    ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
    ['LUNGHEZZA', 'XXX m', 'LARGHEZZA', 'XXX m'],
    ['DISLOCAMENTO', 'XXX t', 'VELOCITÀ', 'XXX kn'],
    ['EQUIPAGGIO', 'XXX', 'ARMA', 'XXX']
  ]
};

// Default canvas dimensions - now configurable
const DEFAULT_CANVAS_WIDTH = 1123; // A4 landscape at 96 DPI
const DEFAULT_CANVAS_HEIGHT = 794;

// Canvas size presets
const CANVAS_PRESETS = {
  A4_LANDSCAPE: { width: 1123, height: 794, name: 'A4 Orizzontale' },
  A4_PORTRAIT: { width: 794, height: 1123, name: 'A4 Verticale' },
  A3_LANDSCAPE: { width: 1587, height: 1123, name: 'A3 Orizzontale' },
  A3_PORTRAIT: { width: 1123, height: 1587, name: 'A3 Verticale' },
  PRESENTATION: { width: 1280, height: 720, name: 'Presentazione (16:9)' },
  CUSTOM: { width: 1200, height: 800, name: 'Personalizzato' }
};

export default function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_HEIGHT);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(2);
  const [canvasBorderColor, setCanvasBorderColor] = useState('#000000');
  const [selectedPreset, setSelectedPreset] = useState('A4_LANDSCAPE');
  const [zoomLevel, setZoomLevel] = useState(100);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingTemplate, setIsExistingTemplate] = useState(false);
  const [visibleElements, setVisibleElements] = useState<{[key: string]: boolean}>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // Carica template esistente se templateId è fornito
  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId) {
        setIsLoading(true);
        try {
          // Carica dal database via API
          const template = await templatesApi.getById(templateId);
          
          if (template) {
            setTemplateName(template.name || '');
            setTemplateDescription(template.description || '');
            setElements(template.elements || []);
            setCanvasWidth(template.canvasWidth || DEFAULT_CANVAS_WIDTH);
            setCanvasHeight(template.canvasHeight || DEFAULT_CANVAS_HEIGHT);
            setCanvasBackground(template.canvasBackground || '#ffffff');
            setCanvasBorderWidth(template.canvasBorderWidth || 2);
            setCanvasBorderColor(template.canvasBorderColor || '#000000');
            
            // Determina il preset basato sulle dimensioni
            const preset = Object.entries(CANVAS_PRESETS).find(
              ([_, size]) => size.width === template.canvasWidth && size.height === template.canvasHeight
            );
            setSelectedPreset(preset ? preset[0] : 'CUSTOM');
            setIsExistingTemplate(true); // Marca come template esistente
            
            console.log('✅ Template caricato:', template.name);
          } else {
            console.warn('⚠️ Template non trovato:', templateId);
            setIsExistingTemplate(false);
            initializeDefaultTemplate();
          }
        } catch (error) {
          console.error('❌ Errore caricamento template:', error);
          setIsExistingTemplate(false);
          initializeDefaultTemplate();
        } finally {
          setIsLoading(false);
        }
      } else {
        // Nuovo template
        setIsExistingTemplate(false);
        initializeDefaultTemplate();
      }
    };

    const initializeDefaultTemplate = () => {
      const defaultElements = [
        {
          id: 'unit_name',
          type: 'unit_name',
          x: 160,
          y: 30,
          width: 400,
          height: 40,
          content: '[NOME UNITÀ]',
          isFixed: true,
          style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
        },
        {
          id: 'unit_class',
          type: 'unit_class',
          x: 160,
          y: 80,
          width: 400,
          height: 40,
          content: '[CLASSE UNITÀ]',
          isFixed: true,
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
          x: canvasWidth - 140,
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
          width: canvasWidth - 40,
          height: 300,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        // Caratteristiche table come elemento fisso
        {
          ...FIXED_CHARACTERISTICS_TABLE,
          width: canvasWidth - 40
        }
      ];
      
      setElements(defaultElements);
    };

    loadTemplate();
  }, [templateId]);

  // Gestione cambio preset canvas
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'CUSTOM') {
      const preset = CANVAS_PRESETS[presetKey as keyof typeof CANVAS_PRESETS];
      setCanvasWidth(preset.width);
      setCanvasHeight(preset.height);
    }
  };

  // Auto-resize elements when canvas changes
  useEffect(() => {
    if (elements.length > 0) {
      setElements(prevElements => prevElements.map(el => {
        // Adatta la posizione del flag al nuovo canvas width
        if (el.id === 'flag' && el.type === 'flag') {
          return { ...el, x: canvasWidth - 140 };
        }
        // Adatta la larghezza di elementi full-width
        if (el.id === 'silhouette' || (el.id === 'characteristics-table' && el.isFixed)) {
          return { ...el, width: canvasWidth - 40 };
        }
        return el;
      }));
    }
  }, [canvasWidth, canvasHeight]);

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
    // Don't allow deletion of fixed elements
    const element = elements.find(el => el.id === elementId);
    if (element?.isFixed || elementId === 'unit_name' || elementId === 'unit_class' || elementId === 'characteristics-table') {
      return;
    }
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const resetTemplate = () => {
    if (confirm('Sei sicuro di voler ripristinare il template alle impostazioni predefinite? Tutte le modifiche andranno perse.')) {
      const defaultElements = [
        {
          id: 'unit_name',
          type: 'unit_name',
          x: 160,
          y: 30,
          width: 400,
          height: 40,
          content: '[NOME UNITÀ]',
          isFixed: true,
          style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
        },
        {
          id: 'unit_class',
          type: 'unit_class',
          x: 160,
          y: 80,
          width: 400,
          height: 40,
          content: '[CLASSE UNITÀ]',
          isFixed: true,
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
          x: canvasWidth - 140,
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
          width: canvasWidth - 40,
          height: 300,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        {
          ...FIXED_CHARACTERISTICS_TABLE,
          width: canvasWidth - 40
        }
      ];
      
      setElements(defaultElements);
      setSelectedElement(null);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Inserisci il nome del template');
      return;
    }

    const templateData = {
      id: templateId || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: elements,
      canvasWidth,
      canvasHeight,
      canvasBackground,
      canvasBorderWidth,
      canvasBorderColor,
      createdAt: templateId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };

    try {
      console.log('💾 Salvando template:', templateData);
      console.log('📋 Template esistente:', isExistingTemplate, 'Template ID:', templateId);
      
      if (templateId && isExistingTemplate) {
        // Aggiorna template esistente nel database
        await templatesApi.update(templateId, templateData);
        console.log('🔄 Template aggiornato:', templateId);
      } else {
        // Crea nuovo template
        const result = await templatesApi.create(templateData);
        templateData.id = result.template_id;
        console.log('🆕 Nuovo template creato:', templateData.id);
      }
      
      console.log('✅ Template salvato con successo');
      onSave(templateData);
    } catch (error) {
      console.error('❌ Errore salvataggio template:', error);
      alert('Errore nel salvare il template. Riprova.');
    }
  };

  const renderElement = (element: TemplateElement) => {
    const isSelected = selectedElement === element.id;
    const isFixed = element.isFixed || element.type === 'unit_name' || element.type === 'unit_class' || element.id === 'characteristics-table';
    
    // Check if element is visible
    const isVisible = visibleElements[element.id] !== false;
    if (!isVisible) {
      return null;
    }
    
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
          <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded z-10">
            {element.id === 'characteristics-table' ? 'Tabella Fissa' : 'Campo Fisso'}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Tools */}
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto max-h-screen">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Editor Template</h2>
            <button
              onClick={resetTemplate}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Ripristina template"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          
          {/* Template Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informazioni Template</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome Template</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es. Template Standard"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Breve descrizione..."
                />
              </div>
            </div>
          </div>
          {/* Canvas Configuration */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Configurazione Canvas</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Formato Predefinito</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(CANVAS_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.name} ({preset.width} × {preset.height})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Larghezza</label>
                  <input
                    type="number"
                    min="400"
                    max="3000"
                    value={canvasWidth}
                    onChange={(e) => {
                      setCanvasWidth(parseInt(e.target.value) || 400);
                      setSelectedPreset('CUSTOM');
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Altezza</label>
                  <input
                    type="number"
                    min="300"
                    max="3000"
                    value={canvasHeight}
                    onChange={(e) => {
                      setCanvasHeight(parseInt(e.target.value) || 300);
                      setSelectedPreset('CUSTOM');
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sfondo Canvas</label>
                <input
                  type="color"
                  value={canvasBackground}
                  onChange={(e) => setCanvasBackground(e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bordo Canvas</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={canvasBorderWidth}
                    onChange={(e) => setCanvasBorderWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Colore Bordo</label>
                  <input
                    type="color"
                    value={canvasBorderColor}
                    onChange={(e) => setCanvasBorderColor(e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visibilità Elementi */}
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Visibilità Elementi</h3>
            <div className="space-y-2">
              {elements.map((element) => {
                const isVisible = visibleElements[element.id] !== false;
                return (
                  <div key={element.id} className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) => {
                          setVisibleElements(prev => ({
                            ...prev,
                            [element.id]: e.target.checked
                          }));
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-700">
                        {element.type === 'unit_name' ? 'Nome Unità' :
                         element.type === 'unit_class' ? 'Classe Unità' :
                         element.type === 'characteristics-table' ? 'Tabella Caratteristiche' :
                         element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex space-x-2">
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
                <Save className="h-4 w-4 mr-2" />
                Salva
              </button>
            </div>
          </div>

          {selectedElement && (
            <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">🔧 Proprietà Elemento</h3>
              {(() => {
                const element = elements.find(el => el.id === selectedElement);
                if (!element) return null;

                const isFixed = element.type === 'unit_name' || element.type === 'unit_class';

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                      <div className="text-xs text-gray-600 capitalize">{element.type.replace('_', ' ')}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                        <input
                          type="number"
                          value={element.x}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement ? { ...el, x: parseInt(e.target.value) || 0 } : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                        <input
                          type="number"
                          value={element.y}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement ? { ...el, y: parseInt(e.target.value) || 0 } : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Larghezza</label>
                        <input
                          type="number"
                          value={element.width}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement ? { ...el, width: parseInt(e.target.value) || 0 } : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Altezza</label>
                        <input
                          type="number"
                          value={element.height}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement ? { ...el, height: parseInt(e.target.value) || 0 } : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    {!isFixed && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => deleteElement(element.id)}
                          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
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

          <div className="p-3 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">➕ Aggiungi Elementi</h3>
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
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-auto max-h-screen">
          {/* Zoom Controls */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-16 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 ml-2"
              >
                100%
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500">
                {canvasWidth} × {canvasHeight}px
              </div>
              <div className="text-xs text-gray-500">
                {elements.filter(el => visibleElements[el.id] !== false).length} elementi visibili
              </div>
            </div>
          </div>
          
          <div className="p-8 min-h-full flex items-center justify-center">
            <div 
              className="bg-white shadow-xl rounded-lg overflow-hidden transition-transform origin-center"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center'
              }}
            >
              {/* Canvas Info Bar */}
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {CANVAS_PRESETS[selectedPreset as keyof typeof CANVAS_PRESETS]?.name || 'Personalizzato'}
                </div>
                <div className="text-xs text-gray-500">
                  {elements.filter(el => visibleElements[el.id] !== false).length} visibili • {elements.filter(el => el.isFixed).length} fissi
                </div>
              </div>
              
              <div
                ref={canvasRef}
                className="relative"
                style={{ 
                  width: canvasWidth, 
                  height: canvasHeight,
                  backgroundColor: canvasBackground,
                  borderWidth: canvasBorderWidth,
                  borderColor: canvasBorderColor,
                  borderStyle: 'solid'
                }}
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
      </div>
      </div>
    </div>
  );
}