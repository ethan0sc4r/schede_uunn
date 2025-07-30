import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Save, Settings, RotateCcw, Move, Trash2, Plus, X } from 'lucide-react';
import { templatesApi } from '../services/api';
import LayoutSettingsModal from './LayoutSettingsModal';

// Re-defining CANVAS_PRESETS here as it's used by the modal
const CANVAS_PRESETS = {
  A4_LANDSCAPE: { width: 1123, height: 794, name: 'A4 Orizzontale' },
  A4_PORTRAIT: { width: 794, height: 1123, name: 'A4 Verticale' },
  A3_LANDSCAPE: { width: 1587, height: 1123, name: 'A3 Orizzontale' },
  A3_PORTRAIT: { width: 1123, height: 1587, name: 'A3 Verticale' },
  PRESENTATION: { width: 1280, height: 720, name: 'Presentazione (16:9)' },
  CUSTOM: { width: 1200, height: 800, name: 'Personalizzato' }
};

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
  isFixed?: boolean;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    fontFamily?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    whiteSpace?: string;
    textAlign?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    headerBackgroundColor?: string;
    columnWidths?: number[];
  };
}

interface TemplateEditorProps {
  templateId?: string;
  onSave: (templateData: any) => void;
  onCancel: () => void;
}

const FIXED_CHARACTERISTICS_TABLE = {
  id: 'characteristics-table',
  type: 'table' as const,
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

const DEFAULT_CANVAS_WIDTH = CANVAS_PRESETS.PRESENTATION.width;
const DEFAULT_CANVAS_HEIGHT = CANVAS_PRESETS.PRESENTATION.height;

// Dummy getImageUrl for frontend display - replace with actual backend URL if needed
const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/static/uploads/${path}`;
};

export default function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_HEIGHT);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(2);
  const [canvasBorderColor, setCanvasBorderColor] = useState('#1e40af');
  const [selectedPreset, setSelectedPreset] = useState('PRESENTATION');
  const [zoomLevel, setZoomLevel] = useState(100);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialElement: null as any, direction: '' }); // Store initial element state for resizing
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingTemplate, setIsExistingTemplate] = useState(false);
  const [visibleElements, setVisibleElements] = useState<{[key: string]: boolean}>({});
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const initializeDefaultTemplate = useCallback(() => {
    // Coordinate ottimizzate per formato PowerPoint 1280x720 (16:9)
    const defaultElements: TemplateElement[] = [
      { id: 'unit_name', type: 'unit_name', x: 150, y: 30, width: 400, height: 40, content: '[NOME UNITÀ]', isFixed: true, style: { fontSize: 22, fontWeight: 'bold', color: '#000' } },
      { id: 'unit_class', type: 'unit_class', x: 150, y: 80, width: 400, height: 35, content: '[CLASSE UNITÀ]', isFixed: true, style: { fontSize: 18, fontWeight: 'normal', color: '#000' } },
      { id: 'logo', type: 'logo', x: 50, y: 30, width: 80, height: 80, isFixed: true, style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#1e40af', borderStyle: 'solid' } },
      { id: 'flag', type: 'flag', x: canvasWidth - 130, y: 30, width: 80, height: 50, isFixed: true, style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#1e40af', borderStyle: 'solid' } },
      { id: 'silhouette', type: 'silhouette', x: 50, y: 130, width: canvasWidth - 100, height: 200, isFixed: true, style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#1e40af', borderStyle: 'solid' } },
      { ...FIXED_CHARACTERISTICS_TABLE, x: 50, y: 350, width: canvasWidth - 100, height: 180 }
    ];
    setElements(defaultElements);
    const initialVisibility: { [key: string]: boolean } = {};
    defaultElements.forEach(el => { initialVisibility[el.id] = true; });
    setVisibleElements(initialVisibility);
  }, [canvasWidth, setVisibleElements]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId) {
        setIsLoading(true);
        try {
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
            const preset = Object.keys(CANVAS_PRESETS).find(key => {
                const p = CANVAS_PRESETS[key as keyof typeof CANVAS_PRESETS];
                return p.width === template.canvasWidth && p.height === template.canvasHeight;
            }) || 'CUSTOM';
            setSelectedPreset(preset);
            setIsExistingTemplate(true);
            const initialVisibility: { [key: string]: boolean } = {};
            (template.elements || []).forEach((el: TemplateElement) => { initialVisibility[el.id] = true; });
            setVisibleElements(initialVisibility);

          } else {
            setIsExistingTemplate(false);
            initializeDefaultTemplate();
          }
        } catch (error) {
          console.error('Error loading template:', error);
          setIsExistingTemplate(false);
          initializeDefaultTemplate();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsExistingTemplate(false);
        initializeDefaultTemplate();
      }
    };
    loadTemplate();
  }, [templateId, initializeDefaultTemplate]);

  const handleLayoutSave = (settings: any) => {
    setCanvasWidth(settings.canvasWidth);
    setCanvasHeight(settings.canvasHeight);
    setCanvasBackground(settings.canvasBackground);
    setCanvasBorderWidth(settings.canvasBorderWidth);
    setCanvasBorderColor(settings.canvasBorderColor);
    setSelectedPreset(settings.selectedPreset);
    setIsLayoutModalOpen(false);
  };

  useEffect(() => {
    if (elements.length > 0) {
      setElements(prevElements => prevElements.map(el => {
        if (el.id === 'flag' && el.type === 'flag') {
          return { ...el, x: canvasWidth - 140 };
        }
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;

    const scale = zoomLevel / 100;
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;

    setElements(prev => prev.map(el => {
      if (el.id === selectedElement) {
        if (isDragging) {
          return { ...el, x: Math.round(el.x + dx), y: Math.round(el.y + dy) };
        } else if (isResizing && dragStart.initialElement) {
          let newX = dragStart.initialElement.x;
          let newY = dragStart.initialElement.y;
          let newWidth = dragStart.initialElement.width;
          let newHeight = dragStart.initialElement.height;

          switch (dragStart.direction) {
            case 'se':
              newWidth = Math.max(10, dragStart.initialElement.width + dx);
              newHeight = Math.max(10, dragStart.initialElement.height + dy);
              break;
            case 'ne':
              newWidth = Math.max(10, dragStart.initialElement.width + dx);
              newHeight = Math.max(10, dragStart.initialElement.height - dy);
              newY = dragStart.initialElement.y + dy;
              break;
            case 'nw':
              newWidth = Math.max(10, dragStart.initialElement.width - dx);
              newHeight = Math.max(10, dragStart.initialElement.height - dy);
              newX = dragStart.initialElement.x + dx;
              newY = dragStart.initialElement.y + dy;
              break;
            case 'sw':
              newWidth = Math.max(10, dragStart.initialElement.width - dx);
              newHeight = Math.max(10, dragStart.initialElement.height + dy);
              newX = dragStart.initialElement.x + dx;
              break;
          }
          return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
        }
      }
      return el;
    }));
    
    // Only update dragStart position for dragging, not for resizing
    if (isDragging) {
      setDragStart({ x: e.clientX, y: e.clientY, initialElement: dragStart.initialElement, direction: dragStart.direction });
    }
  }, [isDragging, isResizing, selectedElement, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart({ x: 0, y: 0, initialElement: null, direction: '' }); // Reset dragStart state
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onMouseUp = () => handleMouseUp();

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsResizing(false);
          setIsDragging(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, initialElement: null, direction: '' }); // Reset initialElement for dragging
  };

  const handleResizeMouseDown = useCallback((elementId: string, e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setDragStart({ // Reusing dragStart to store initial mouse position and element dimensions
        x: e.clientX,
        y: e.clientY,
        initialElement: { x: element.x, y: element.y, width: element.width, height: element.height },
        direction: direction
      });
    }
  }, [elements]);

  const handleTextEdit = (elementId: string, newText: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content: newText } : el
    ));
  };

  const handleImageUpload = async (elementId: string, file: File) => {
    try {
      const element = elements.find(el => el.id === elementId);
      const elementType = element?.type || 'general';
      
      const formData = new FormData();
      formData.append('image', file);
      const subfolder = elementType === 'silhouette' ? 'silhouettes' : 
                      elementType === 'logo' ? 'logos' : 
                      elementType === 'flag' ? 'flags' : 'general';
      formData.append('subfolder', subfolder);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      const imagePath = data.file_path;
      
      console.log('Upload response:', data);
      console.log('Image path:', imagePath);
      console.log('Full image URL:', getImageUrl(imagePath));
      
      setElements(prev => prev.map(el => 
        el.id === elementId ? { ...el, image: imagePath } : el
      ));
      
      console.log('Image uploaded successfully:', imagePath);
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Errore durante l\'upload dell\'immagine');
    }
  };

  const deleteElement = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element?.isFixed) {
      if (!confirm('Questo è un elemento fisso del template. Sei sicuro di volerlo eliminare? Non potrà essere riaggiunto se non ripristinando il template.')) {
        return;
      }
    }
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const resetTemplate = () => {
    if (confirm('Sei sicuro di voler ripristinare il template alle impostazioni predefinite? Tutte le modifiche andranno perse.')) {
      initializeDefaultTemplate();
      setSelectedElement(null);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Inserisci il nome del template');
      return;
    }
    const templateData = { id: templateId || `template-${Date.now()}`, name: templateName, description: templateDescription, elements, canvasWidth, canvasHeight, canvasBackground, canvasBorderWidth, canvasBorderColor, createdAt: templateId ? undefined : new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: false };
    try {
      if (templateId && isExistingTemplate) {
        await templatesApi.update(templateId, templateData);
      } else {
        const result = await templatesApi.create(templateData);
        templateData.id = result.template_id;
      }
      onSave(templateData);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Errore nel salvare il template. Riprova.');
    }
  };

  const addElement = (type: TemplateElement['type']) => {
    const newId = `${type}-${Date.now()}`;
    const newElement: TemplateElement = {
      id: newId,
      type,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      content: type === 'text' ? 'Nuovo Testo' : '',
      style: {},
      isFixed: false
    };
    if (type === 'table') {
      newElement.width = 400;
      newElement.height = 150;
      newElement.tableData = [['Col 1', 'Col 2'], ['Row 1, Cell 1', 'Row 1, Cell 2']];
    }
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newId);
  };

  const renderElement = (element: TemplateElement) => {
    if (visibleElements[element.id] === false) return null;
    const isSelected = selectedElement === element.id;
    const isFixed = element.isFixed;

    return (
      <div
        key={element.id}
        className={`absolute ${!isFixed ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
        onClick={(e) => handleElementClick(element.id, e)}
        onMouseDown={(e) => handleMouseDown(element.id, e)}
      >
        {/* Fixed fields indicator */}
        {isFixed && (
          <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded z-10">
            {element.id === 'characteristics-table' ? 'Tabella Fissa' : 'Campo Fisso'}
          </div>
        )}

        {(element.type === 'text' || element.type === 'unit_name' || element.type === 'unit_class') && (
          <div
            className="w-full h-full flex items-center justify-start px-2"
            style={{
              fontSize: element.style?.fontSize,
              fontWeight: element.style?.fontWeight,
              color: element.style?.color,
              whiteSpace: element.style?.whiteSpace as any,
              backgroundColor: element.style?.backgroundColor,
              borderRadius: element.style?.borderRadius,
              borderWidth: element.style?.borderWidth,
              borderColor: element.style?.borderColor,
              borderStyle: element.style?.borderStyle,
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

        {(element.type === 'logo' || element.type === 'silhouette' || element.type === 'flag') && (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300" style={element.style as React.CSSProperties}>
            {element.image ? (
              <img 
                src={getImageUrl(element.image)} 
                alt={element.type} 
                className="max-w-full max-h-full object-contain" 
                style={{ borderRadius: element.style?.borderRadius || 0 }}
              />
            ) : (
              <span className="text-gray-500 text-sm select-none">{element.type.replace('_', ' ').toUpperCase()}</span>
            )}
          </div>
        )}

        {element.type === 'table' && (
          <div className="w-full h-full bg-white border border-gray-400 overflow-auto">
            <div className="p-2">
              <div className="text-xs font-bold mb-2">CARATTERISTICHE</div>
              <div className="text-xs">
                {element.tableData?.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex border-b border-gray-300">
                    {row.map((cell, colIndex) => {
                      const columnWidths = element.style?.columnWidths || [];
                      const width = columnWidths[colIndex] ? `${columnWidths[colIndex]}%` : 'auto';
                      const headerBgColor = element.style?.headerBackgroundColor || '#f3f4f6';
                      
                      return (
                        <div
                          key={colIndex}
                          className="p-2 border-r border-gray-300"
                          style={{
                            width: width,
                            flexBasis: width,
                            backgroundColor: rowIndex === 0 ? headerBgColor : (colIndex % 2 === 0 ? '#f9fafb' : '#ffffff'),
                            fontWeight: rowIndex === 0 ? 'bold' : 'normal'
                          }}
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

        {isSelected && (
          <>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(element.id, e, 'se')} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(element.id, e, 'ne')} />
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(element.id, e, 'nw')} />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(element.id, e, 'sw')} />
          </>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="h-full flex bg-gray-100">
      <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editor Template</h2>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200"><X className="h-6 w-6" /></button>
        </div>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Informazioni</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
              <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Es. Template Standard" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Breve descrizione..." />
            </div>
          </div>
        </div>

        <div className="mb-4">
            <button
                onClick={() => setIsLayoutModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
                <Settings className="h-5 w-5 mr-2" />
                Modifica Layout
            </button>
        </div>

        {/* Add Elements Section */}
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Aggiungi Elementi</h3>
          <div className="space-y-2">
            <button
              onClick={() => addElement('text')}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              + Testo
            </button>
            <button
              onClick={() => addElement('logo')}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
              + Logo
            </button>
            <button
              onClick={() => addElement('flag')}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              + Bandiera
            </button>
            <button
              onClick={() => addElement('silhouette')}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              + Silhouette
            </button>
            <button
              onClick={() => addElement('table')}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              + Tabella
            </button>
          </div>
        </div>

        {selectedElement && (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🔧 Proprietà Elemento</h3>
            {(() => {
              const element = elements.find(el => el.id === selectedElement);
              if (!element) return null;

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

                  {(element.type === 'unit_name' || element.type === 'unit_class') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {element.type === 'unit_name' ? 'Testo Nome Unità' : 'Testo Classe Unità'}
                        </label>
                        <textarea
                          value={element.content || ''}
                          onChange={(e) => handleTextEdit(element.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          rows={2}
                          placeholder={element.type === 'unit_name' ? '[NOME UNITÀ]' : '[CLASSE]'}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Carattere</label>
                        <select
                          value={element.style?.fontFamily || 'Arial'}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement 
                              ? { ...el, style: { ...el.style, fontFamily: e.target.value } }
                              : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Impact">Impact</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dimensione</label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={element.style?.fontSize || 16}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, fontSize: parseInt(e.target.value) || 16 } }
                                : el
                            ))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Colore</label>
                          <input
                            type="color"
                            value={element.style?.color || '#000000'}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, color: e.target.value } }
                              : el
                            ))}
                            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      fontWeight: el.style?.fontWeight === 'bold' ? 'normal' : 'bold' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm font-bold border rounded transition-colors ${
                              element.style?.fontWeight === 'bold'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            B
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      fontStyle: el.style?.fontStyle === 'italic' ? 'normal' : 'italic' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm italic border rounded transition-colors ${
                              element.style?.fontStyle === 'italic'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            I
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      textDecoration: el.style?.textDecoration === 'underline' ? 'none' : 'underline' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm underline border rounded transition-colors ${
                              element.style?.textDecoration === 'underline'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            U
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allineamento</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'left' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'left' || !element.style?.textAlign
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ⇤
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'center' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'center'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ↔
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'right' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'right'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ⇥
                          </button>
                        </div>
                      </div>

                      {/* Border Radius for Unit Name/Class */}
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Arrotondamento</h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bordo Arrotondato (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={element.style?.borderRadius || 0}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, borderRadius: parseInt(e.target.value) || 0 } }
                                : el
                            ))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {element.type === 'text' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
                        <textarea
                          value={element.content || ''}
                          onChange={(e) => handleTextEdit(element.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Carattere</label>
                        <select
                          value={element.style?.fontFamily || 'Arial'}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement 
                              ? { ...el, style: { ...el.style, fontFamily: e.target.value } }
                              : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Impact">Impact</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dimensione</label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={element.style?.fontSize || 16}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, fontSize: parseInt(e.target.value) || 16 } }
                                : el
                            ))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Colore</label>
                          <input
                            type="color"
                            value={element.style?.color || '#000000'}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, color: e.target.value } }
                              : el
                            ))}
                            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      fontWeight: el.style?.fontWeight === 'bold' ? 'normal' : 'bold' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm font-bold border rounded transition-colors ${
                              element.style?.fontWeight === 'bold'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            B
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      fontStyle: el.style?.fontStyle === 'italic' ? 'normal' : 'italic' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm italic border rounded transition-colors ${
                              element.style?.fontStyle === 'italic'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            I
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { 
                                    ...el, 
                                    style: { 
                                      ...el.style, 
                                      textDecoration: el.style?.textDecoration === 'underline' ? 'none' : 'underline' 
                                    } 
                                  }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm underline border rounded transition-colors ${
                              element.style?.textDecoration === 'underline'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            U
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allineamento</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'left' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'left' || !element.style?.textAlign
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ⇤
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'center' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'center'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ↔
                          </button>
                          <button
                            onClick={() => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, textAlign: 'right' } }
                                : el
                            ))}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              element.style?.textAlign === 'right'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            ⇥
                          </button>
                        </div>
                      </div>

                      {/* Border Radius for Text */}
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Arrotondamento</h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bordo Arrotondato (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={element.style?.borderRadius || 0}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, borderRadius: parseInt(e.target.value) || 0 } }
                                : el
                            ))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {(element.type === 'logo' || element.type === 'flag' || element.type === 'silhouette') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Immagine (URL)</label>
                      <input
                        type="text"
                        value={element.image || ''}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement ? { ...el, image: e.target.value } : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        placeholder="URL immagine"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(element.id, e.target.files[0])}
                        className="w-full text-xs mt-2 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      
                      {/* Border Radius for Images */}
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Arrotondamento</h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bordo Arrotondato (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={element.style?.borderRadius || 0}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, borderRadius: parseInt(e.target.value) || 0 } }
                                : el
                            ))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {element.type === 'table' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dati Tabella (JSON)</label>
                      <textarea
                        value={JSON.stringify(element.tableData) || ''}
                        onChange={(e) => {
                          try {
                            setElements(prev => prev.map(el => 
                              el.id === selectedElement ? { ...el, tableData: JSON.parse(e.target.value) } : el
                            ));
                          } catch (error) {
                            console.error("Invalid JSON for table data", error);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        rows={5}
                      />
                      
                      {/* Table Customization */}
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Personalizzazione Tabella</h4>
                        
                        {/* Header Background Color */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Colore Intestazioni</label>
                          <input
                            type="color"
                            value={element.style?.headerBackgroundColor || '#f3f4f6'}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, headerBackgroundColor: e.target.value } }
                                : el
                            ))}
                            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Column Widths */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Larghezze Colonne (%)</label>
                          <input
                            type="text"
                            value={element.style?.columnWidths ? element.style.columnWidths.join(',') : '25,25,25,25'}
                            onChange={(e) => {
                              const widths = e.target.value.split(',').map(w => parseInt(w.trim()) || 25);
                              setElements(prev => prev.map(el => 
                                el.id === selectedElement 
                                  ? { ...el, style: { ...el.style, columnWidths: widths } }
                                  : el
                              ));
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="25,25,25,25"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separare con virgole (es: 30,20,30,20)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Color Control - Available for all elements */}
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Riempimento</h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Colore di Sfondo</label>
                      <input
                        type="color"
                        value={element.style?.backgroundColor || '#ffffff'}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement 
                            ? { ...el, style: { ...el.style, backgroundColor: e.target.value } }
                            : el
                        ))}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Border Controls - Available for all elements */}
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Bordo</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Spessore (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={element.style?.borderWidth || 0}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement 
                              ? { ...el, style: { ...el.style, borderWidth: parseInt(e.target.value) || 0 } }
                              : el
                          ))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Colore</label>
                        <input
                          type="color"
                          value={element.style?.borderColor || '#000000'}
                          onChange={(e) => setElements(prev => prev.map(el => 
                            el.id === selectedElement 
                              ? { ...el, style: { ...el.style, borderColor: e.target.value } }
                              : el
                          ))}
                          className="w-full h-8 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stile</label>
                      <select
                        value={element.style?.borderStyle || 'solid'}
                        onChange={(e) => setElements(prev => prev.map(el => 
                          el.id === selectedElement 
                            ? { ...el, style: { ...el.style, borderStyle: e.target.value } }
                            : el
                        ))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="none">Nessuno</option>
                        <option value="solid">Solido</option>
                        <option value="dashed">Tratteggiato</option>
                        <option value="dotted">Punteggiato</option>
                        <option value="double">Doppio</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => deleteElement(element.id)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
                    >
                      🗑️ Elimina Elemento
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="mt-auto space-y-3 pt-4">
          <button onClick={handleSave} className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base shadow-lg">
            <Save className="h-5 w-5 mr-2" />
            Salva Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="p-2 text-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(10, prev - 10))}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-16 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
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
        </div>
        <div className="flex-1 overflow-auto p-8">
            <div 
              className="bg-white shadow-xl rounded-lg mx-auto"
              style={{ 
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                borderWidth: canvasBorderWidth,
                borderColor: canvasBorderColor,
                borderStyle: 'solid'
              }}
            >
              <div
                ref={canvasRef}
                className="relative w-full h-full"
                style={{ 
                    backgroundColor: canvasBackground,
                    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QwZDBkMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L2BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+)',
                    backgroundSize: '20px 20px'
                }}
                onClick={handleCanvasClick}
              >
                {elements.map(renderElement)}
              </div>
            </div>
          </div>
        </div>
        <LayoutSettingsModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          onSave={handleLayoutSave}
          initialSettings={{
            canvasWidth,
            canvasHeight,
            canvasBackground,
            canvasBorderWidth,
            canvasBorderColor,
            selectedPreset
          }}
        />
    </div>
  );
}