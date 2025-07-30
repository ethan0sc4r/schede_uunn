import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Save, X, Plus, Trash2, Eye, EyeOff, Upload, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import type { NavalUnit, UnitCharacteristic } from '../types/index.ts';
import { templatesApi } from '../services/api';

interface CardEditorProps {
  unit?: NavalUnit | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface CoreElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'unit_name' | 'unit_class';
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  image?: string;
  content?: string;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    borderRadius?: number;
  };
}

interface MobileElement {
  id: string;
  type: 'text' | 'table' | 'image';
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
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    borderRadius?: number;
    fontFamily?: string;
    textAlign?: string;
  };
}

interface CardState {
  name: string;
  unit_class: string;
  nation: string;
  logo_path?: string;
  silhouette_path?: string;
  flag_path?: string;
  characteristics: UnitCharacteristic[];
  current_template_id: string;
  coreElements: CoreElement[];
  mobileElements: MobileElement[];
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  canvasBorderWidth: number;
  canvasBorderColor: string;
  zoomLevel: number;
}

const INITIAL_CORE_ELEMENTS: CoreElement[] = [
  {
    id: 'logo',
    type: 'logo',
    x: 20,
    y: 20,
    width: 120,
    height: 120,
    visible: true,
    style: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid', borderRadius: 8 }
  },
  {
    id: 'flag',
    type: 'flag',
    x: 983,
    y: 20,
    width: 120,
    height: 80,
    visible: true,
    style: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid', borderRadius: 8 }
  },
  {
    id: 'unit_name',
    type: 'unit_name',
    x: 160,
    y: 30,
    width: 400,
    height: 40,
    visible: true,
    content: '[NOME UNITÀ]',
    style: { fontSize: 24, fontWeight: 'bold', color: '#000000' }
  },
  {
    id: 'unit_class',
    type: 'unit_class',
    x: 160,
    y: 80,
    width: 400,
    height: 40,
    visible: true,
    content: '[CLASSE UNITÀ]',
    style: { fontSize: 20, fontWeight: 'bold', color: '#000000' }
  },
  {
    id: 'silhouette',
    type: 'silhouette',
    x: 20,
    y: 180,
    width: 1083,
    height: 300,
    visible: true,
    style: { backgroundColor: '#0f766e', borderWidth: 2, borderColor: '#000000', borderStyle: 'solid', borderRadius: 8 }
  }
];

export default function CardEditor({ unit, onSave, onCancel }: CardEditorProps) {
  // Initialize core elements only if editing existing unit or if layout_config exists
  const initializeCoreElements = () => {
    if (unit?.layout_config?.elements) {
      // Load from existing layout_config with EXACT images from this unit
      return unit.layout_config.elements.filter((el: any) => 
        ['logo', 'flag', 'silhouette', 'unit_name', 'unit_class'].includes(el.type)
      ).map((el: any) => ({
        ...el,
        visible: el.visible !== false,
        // IMPORTANT: Use unit's specific images, not template images
        image: el.type === 'logo' ? unit.logo_path :
               el.type === 'silhouette' ? unit.silhouette_path :
               el.type === 'flag' ? unit.flag_path : 
               el.image
      }));
    } else if (unit) {
      // Existing unit without layout_config - create basic elements with existing images
      return INITIAL_CORE_ELEMENTS.map(el => ({
        ...el,
        image: el.type === 'logo' ? unit.logo_path :
               el.type === 'silhouette' ? unit.silhouette_path :
               el.type === 'flag' ? unit.flag_path : undefined
      }));
    } else {
      // New unit - apply default template automatically
      return INITIAL_CORE_ELEMENTS.map(el => ({
        ...el,
        image: undefined // No images for new unit
      }));
    }
  };

  const initializeMobileElements = () => {
    if (unit?.layout_config?.elements) {
      return unit.layout_config.elements.filter((el: any) => 
        ['text', 'table', 'image'].includes(el.type)
      );
    }
    return [];
  };

  const [cardState, setCardState] = useState<CardState>({
    name: unit?.name || '',
    unit_class: unit?.unit_class || '',
    nation: unit?.nation || '',
    logo_path: unit?.logo_path,
    silhouette_path: unit?.silhouette_path,
    flag_path: unit?.flag_path,
    characteristics: unit?.characteristics || [],
    current_template_id: unit?.current_template_id || 'naval-card-standard',
    coreElements: initializeCoreElements(),
    mobileElements: initializeMobileElements(),
    canvasWidth: unit?.layout_config?.canvasWidth || 1123,
    canvasHeight: unit?.layout_config?.canvasHeight || 794,
    canvasBackground: unit?.layout_config?.canvasBackground || '#ffffff',
    canvasBorderWidth: unit?.layout_config?.canvasBorderWidth || 2,
    canvasBorderColor: unit?.layout_config?.canvasBorderColor || '#000000',
    zoomLevel: 100
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ 
    x: 0, y: 0, 
    elementX: 0, elementY: 0, 
    elementWidth: 0, elementHeight: 0 
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showElementProperties, setShowElementProperties] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/static/${path}`;
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await templatesApi.getAll();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const applyTemplate = async (templateId: string) => {
    try {
      const template = await templatesApi.getById(templateId);
      if (!template) return;

      setCardState(prev => {
        // Create missing core elements from template
        const existingCoreIds = prev.coreElements.map(el => el.id);
        const templateCoreElements = template.elements?.filter((el: any) => 
          ['logo', 'flag', 'silhouette', 'unit_name', 'unit_class'].includes(el.type)
        ) || [];
        
        const newCoreElements = templateCoreElements.filter((el: any) => 
          !existingCoreIds.includes(el.id)
        ).map((el: any) => ({
          ...el,
          visible: el.visible !== false,
          // NEVER use template images - always use unit's own images
          image: el.type === 'logo' ? prev.logo_path :
                 el.type === 'silhouette' ? prev.silhouette_path :
                 el.type === 'flag' ? prev.flag_path : undefined
        }));

        return {
          ...prev,
          current_template_id: templateId,
          canvasWidth: template.canvasWidth || 1123,
          canvasHeight: template.canvasHeight || 794,
          canvasBackground: template.canvasBackground || '#ffffff',
          canvasBorderWidth: template.canvasBorderWidth || 2,
          canvasBorderColor: template.canvasBorderColor || '#000000',
          // Update existing core elements with template layout but preserve images
          coreElements: [
            ...prev.coreElements.map(element => {
              const templateElement = template.elements?.find((e: any) => e.id === element.id);
              if (templateElement) {
                return {
                  ...element,
                  x: templateElement.x ?? element.x,
                  y: templateElement.y ?? element.y,
                  width: templateElement.width ?? element.width,
                  height: templateElement.height ?? element.height,
                  visible: templateElement.visible !== false,
                  style: { ...element.style, ...templateElement.style },
                  // PRESERVE unit's own images, never use template images
                  image: element.image
                };
              }
              return element;
            }),
            ...newCoreElements
          ]
        };
      });
      
      setShowTemplateSelector(false);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Errore nell\'applicare il template');
    }
  };

  const handleImageUpload = async (elementId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const element = [...cardState.coreElements, ...cardState.mobileElements].find(e => e.id === elementId);
      const subfolder = element?.type === 'silhouette' ? 'silhouettes' : 
                      element?.type === 'logo' ? 'logos' : 
                      element?.type === 'flag' ? 'flags' : 'general';
      
      formData.append('subfolder', subfolder);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const imagePath = data.file_path;
      
      setCardState(prev => ({
        ...prev,
        coreElements: prev.coreElements.map(el => 
          el.id === elementId ? { ...el, image: imagePath } : el
        ),
        mobileElements: prev.mobileElements.map(el => 
          el.id === elementId ? { ...el, image: imagePath } : el
        ),
        ...(elementId === 'logo' && { logo_path: imagePath }),
        ...(elementId === 'silhouette' && { silhouette_path: imagePath }),
        ...(elementId === 'flag' && { flag_path: imagePath })
      }));
      
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Errore durante l\'upload dell\'immagine');
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = [...cardState.coreElements, ...cardState.mobileElements].find(el => el.id === elementId);
    if (!element) return;
    
    setSelectedElement(elementId);
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
      elementWidth: element.width,
      elementHeight: element.height
    });
  }, [cardState.coreElements, cardState.mobileElements]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;
    
    const scale = cardState.zoomLevel / 100;
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;
    
    setCardState(prev => ({
      ...prev,
      coreElements: prev.coreElements.map(el => {
        if (el.id === selectedElement) {
          if (isDragging) {
            return {
              ...el,
              x: Math.max(0, Math.min(prev.canvasWidth - el.width, dragStart.elementX + dx)),
              y: Math.max(0, Math.min(prev.canvasHeight - el.height, dragStart.elementY + dy))
            };
          } else if (isResizing) {
            return {
              ...el,
              width: Math.max(20, dragStart.elementWidth + dx),
              height: Math.max(20, dragStart.elementHeight + dy)
            };
          }
        }
        return el;
      }),
      mobileElements: prev.mobileElements.map(el => {
        if (el.id === selectedElement) {
          if (isDragging) {
            return {
              ...el,
              x: Math.max(0, Math.min(prev.canvasWidth - el.width, dragStart.elementX + dx)),
              y: Math.max(0, Math.min(prev.canvasHeight - el.height, dragStart.elementY + dy))
            };
          } else if (isResizing) {
            return {
              ...el,
              width: Math.max(20, dragStart.elementWidth + dx),
              height: Math.max(20, dragStart.elementHeight + dy)
            };
          }
        }
        return el;
      })
    }));
  }, [selectedElement, isDragging, isResizing, dragStart, cardState.zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const createMobileElement = (type: MobileElement['type']) => {
    const newElement: MobileElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'table' ? 400 : 200,
      height: type === 'table' ? 150 : type === 'text' ? 50 : 100,
      content: type === 'text' ? 'Nuovo elemento di testo' : undefined,
      tableData: type === 'table' ? [
        ['Caratteristica', 'Valore'],
        ['Campo 1', 'Dato 1'],
        ['Campo 2', 'Dato 2']
      ] : undefined,
      style: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderStyle: 'solid',
        borderRadius: 4,
        fontFamily: 'Arial',
        textAlign: 'left'
      }
    };
    
    setCardState(prev => ({
      ...prev,
      mobileElements: [...prev.mobileElements, newElement]
    }));
    
    setSelectedElement(newElement.id);
  };

  const deleteMobileElement = (elementId: string) => {
    setCardState(prev => ({
      ...prev,
      mobileElements: prev.mobileElements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const toggleCoreElementVisibility = (elementId: string) => {
    setCardState(prev => ({
      ...prev,
      coreElements: prev.coreElements.map(el => 
        el.id === elementId ? { ...el, visible: !el.visible } : el
      )
    }));
  };

  const addCoreElement = (type: CoreElement['type']) => {
    // Check if element already exists
    const exists = cardState.coreElements.find(el => el.id === type);
    if (exists) return;

    const elementDefaults = INITIAL_CORE_ELEMENTS.find(el => el.id === type);
    if (!elementDefaults) return;

    const newElement: CoreElement = {
      ...elementDefaults,
      image: elementDefaults.type === 'logo' ? cardState.logo_path :
             elementDefaults.type === 'silhouette' ? cardState.silhouette_path :
             elementDefaults.type === 'flag' ? cardState.flag_path : undefined
    };

    setCardState(prev => ({
      ...prev,
      coreElements: [...prev.coreElements, newElement]
    }));
  };

  const removeCoreElement = (elementId: string) => {
    setCardState(prev => ({
      ...prev,
      coreElements: prev.coreElements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const updateElementContent = (elementId: string, content: string) => {
    setCardState(prev => ({
      ...prev,
      coreElements: prev.coreElements.map(el => {
        if (el.id === elementId) {
          if (el.type === 'unit_name') {
            return { ...el, content: prev.name || content };
          } else if (el.type === 'unit_class') {
            return { ...el, content: prev.unit_class || content };
          }
          return { ...el, content };
        }
        return el;
      }),
      mobileElements: prev.mobileElements.map(el => 
        el.id === elementId ? { ...el, content } : el
      )
    }));
  };

  const updateElementStyle = (elementId: string, styleUpdates: any) => {
    setCardState(prev => ({
      ...prev,
      coreElements: prev.coreElements.map(el => 
        el.id === elementId ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      ),
      mobileElements: prev.mobileElements.map(el => 
        el.id === elementId ? { ...el, style: { ...el.style, ...styleUpdates } } : el
      )
    }));
  };

  const addCharacteristic = () => {
    const newChar: UnitCharacteristic = {
      id: Date.now(),
      naval_unit_id: unit?.id || 0,
      characteristic_name: '',
      characteristic_value: '',
      order_index: cardState.characteristics.length
    };
    
    setCardState(prev => ({
      ...prev,
      characteristics: [...prev.characteristics, newChar]
    }));
  };

  const updateCharacteristic = (index: number, field: 'characteristic_name' | 'characteristic_value', value: string) => {
    setCardState(prev => ({
      ...prev,
      characteristics: prev.characteristics.map((char, i) => 
        i === index ? { ...char, [field]: value } : char
      )
    }));
  };

  const removeCharacteristic = (index: number) => {
    setCardState(prev => ({
      ...prev,
      characteristics: prev.characteristics.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCard = () => {
    const cardData = {
      ...cardState,
      layout_config: {
        elements: [...cardState.coreElements, ...cardState.mobileElements],
        canvasWidth: cardState.canvasWidth,
        canvasHeight: cardState.canvasHeight,
        canvasBackground: cardState.canvasBackground,
        canvasBorderWidth: cardState.canvasBorderWidth,
        canvasBorderColor: cardState.canvasBorderColor
      }
    };
    
    onSave(cardData);
  };

  const renderElement = (element: CoreElement | MobileElement) => {
    if ('visible' in element && !element.visible) return null;
    
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-blue-500 z-20' : 'z-10'}`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          ...(element.style as React.CSSProperties)
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
      >
        {/* Rendering based on element type */}
        {(element.type === 'logo' || element.type === 'flag' || element.type === 'silhouette') && (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50">
            {element.image ? (
              <img 
                src={getImageUrl(element.image)} 
                alt={element.type} 
                className="max-w-full max-h-full object-contain" 
                draggable={false}
              />
            ) : (
              <span className="text-gray-500 text-xs font-medium uppercase">
                {element.type.replace('_', ' ')}
              </span>
            )}
          </div>
        )}
        
        {(element.type === 'unit_name' || element.type === 'unit_class' || element.type === 'text') && (
          <div className="w-full h-full flex items-center px-2">
            {isSelected ? (
              <textarea
                value={element.content || ''}
                onChange={(e) => updateElementContent(element.id, e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={element.style as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <div className="w-full h-full flex items-center" style={element.style as React.CSSProperties}>
                {element.type === 'unit_name' ? cardState.name || '[NOME UNITÀ]' :
                 element.type === 'unit_class' ? cardState.unit_class || '[CLASSE UNITÀ]' :
                 element.content || 'Testo'}
              </div>
            )}
          </div>
        )}
        
        {element.type === 'table' && (
          <div className="w-full h-full overflow-auto bg-white">
            <table className="w-full border-collapse" style={element.style as React.CSSProperties}>
              <tbody>
                {(element as MobileElement).tableData?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td 
                        key={colIndex} 
                        className="border border-gray-400 px-2 py-1 text-sm"
                        style={{ fontSize: element.style?.fontSize }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {element.type === 'image' && (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50">
            {element.image ? (
              <img 
                src={getImageUrl(element.image)} 
                alt="Custom image" 
                className="max-w-full max-h-full object-contain" 
                draggable={false}
              />
            ) : (
              <span className="text-gray-500 text-xs font-medium">
                IMMAGINE
              </span>
            )}
          </div>
        )}
        
        {/* Resize handle for selected elements */}
        {isSelected && (
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize z-30"
            onMouseDown={(e) => handleMouseDown(e, element.id, 'resize')}
          />
        )}
      </div>
    );
  };

  const selectedElementData = selectedElement ? 
    [...cardState.coreElements, ...cardState.mobileElements].find(el => el.id === selectedElement) : null;

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - Controls */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {unit ? 'Modifica Scheda' : 'Nuova Scheda'}
            </h1>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Informazioni Base</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome Unità Navale"
                value={cardState.name}
                onChange={(e) => setCardState(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Classe Unità"
                value={cardState.unit_class}
                onChange={(e) => setCardState(prev => ({ ...prev, unit_class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Nazione"
                value={cardState.nation}
                onChange={(e) => setCardState(prev => ({ ...prev, nation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Template Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Template</h3>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Seleziona Template
            </button>
          </div>
          
          {/* Core Elements */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Elementi Cardine</h3>
              <div className="text-xs text-gray-500">
                {cardState.coreElements.length}/5
              </div>
            </div>
            
            {/* Add missing core elements */}
            {['logo', 'flag', 'silhouette', 'unit_name', 'unit_class'].filter(type => 
              !cardState.coreElements.find(el => el.id === type)
            ).length > 0 && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-xs text-yellow-800 mb-2">Aggiungi elementi mancanti:</div>
                <div className="flex flex-wrap gap-1">
                  {['logo', 'flag', 'silhouette', 'unit_name', 'unit_class'].filter(type => 
                    !cardState.coreElements.find(el => el.id === type)
                  ).map(type => (
                    <button
                      key={type}
                      onClick={() => addCoreElement(type as CoreElement['type'])}
                      className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                    >
                      + {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {cardState.coreElements.map(element => (
                <div key={element.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700 capitalize font-medium">
                    {element.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCoreElementVisibility(element.id)}
                      className={`p-1 rounded ${element.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={element.visible ? 'Nascondi' : 'Mostra'}
                    >
                      {element.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    {(element.type === 'logo' || element.type === 'flag' || element.type === 'silhouette') && (
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          fileInputRef.current!.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageUpload(element.id, file);
                          };
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Carica immagine"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeCoreElement(element.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Rimuovi elemento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {cardState.coreElements.length === 0 && (
                <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-sm mb-2 font-medium">Scheda Vuota</div>
                  <div className="text-xs text-gray-400 mb-3">
                    Aggiungi elementi manualmente o applica un template per iniziare
                  </div>
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Scegli Template
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Elements */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Elementi Mobili</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => createMobileElement('text')}
                className="p-2 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors flex flex-col items-center"
              >
                <Plus className="h-3 w-3 mb-1" />
                Testo
              </button>
              <button
                onClick={() => createMobileElement('table')}
                className="p-2 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors flex flex-col items-center"
              >
                <Plus className="h-3 w-3 mb-1" />
                Tabella
              </button>
              <button
                onClick={() => createMobileElement('image')}
                className="p-2 bg-purple-500 text-white rounded-md text-xs hover:bg-purple-600 transition-colors flex flex-col items-center"
              >
                <Plus className="h-3 w-3 mb-1" />
                Immagine
              </button>
            </div>
            
            {cardState.mobileElements.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cardState.mobileElements.map(element => (
                  <div key={element.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-700 capitalize font-medium">
                      {element.type} #{element.id.split('-')[1]?.substr(0, 4)}
                    </span>
                    <button
                      onClick={() => deleteMobileElement(element.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina elemento"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Element Properties */}
          {selectedElementData && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">
                Proprietà: {selectedElementData.type.replace('_', ' ')}
              </h3>
              
              {/* Style controls for text elements */}
              {(selectedElementData.type === 'text' || selectedElementData.type === 'unit_name' || selectedElementData.type === 'unit_class') && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Dimensione</label>
                      <input
                        type="number"
                        min="8"
                        max="72"
                        value={selectedElementData.style?.fontSize || 16}
                        onChange={(e) => updateElementStyle(selectedElementData.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Colore</label>
                      <input
                        type="color"
                        value={selectedElementData.style?.color || '#000000'}
                        onChange={(e) => updateElementStyle(selectedElementData.id, { color: e.target.value })}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sfondo</label>
                    <input
                      type="color"
                      value={selectedElementData.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementStyle(selectedElementData.id, { backgroundColor: e.target.value })}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bordo</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={selectedElementData.style?.borderWidth || 0}
                        onChange={(e) => updateElementStyle(selectedElementData.id, { borderWidth: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Colore Bordo</label>
                      <input
                        type="color"
                        value={selectedElementData.style?.borderColor || '#000000'}
                        onChange={(e) => updateElementStyle(selectedElementData.id, { borderColor: e.target.value })}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload button for image elements */}
              {(selectedElementData.type === 'image' || selectedElementData.type === 'logo' || selectedElementData.type === 'flag' || selectedElementData.type === 'silhouette') && (
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    fileInputRef.current!.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(selectedElementData.id, file);
                    };
                  }}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Carica Immagine
                </button>
              )}
            </div>
          )}
          
          {/* Characteristics */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Caratteristiche</h3>
              <button
                onClick={addCharacteristic}
                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Aggiungi caratteristica"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cardState.characteristics.map((char, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={char.characteristic_name}
                    onChange={(e) => updateCharacteristic(index, 'characteristic_name', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Valore"
                    value={char.characteristic_value}
                    onChange={(e) => updateCharacteristic(index, 'characteristic_value', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                  <button
                    onClick={() => removeCharacteristic(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Rimuovi"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Zoom Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Zoom: {cardState.zoomLevel}%
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCardState(prev => ({ ...prev, zoomLevel: Math.max(25, prev.zoomLevel - 25) }))}
                className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="25"
                max="200"
                step="25"
                value={cardState.zoomLevel}
                onChange={(e) => setCardState(prev => ({ ...prev, zoomLevel: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <button
                onClick={() => setCardState(prev => ({ ...prev, zoomLevel: Math.min(200, prev.zoomLevel + 25) }))}
                className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSaveCard}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salva Scheda
            </button>
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl"
            style={{
              width: cardState.canvasWidth,
              height: cardState.canvasHeight,
              backgroundColor: cardState.canvasBackground,
              borderWidth: cardState.canvasBorderWidth,
              borderColor: cardState.canvasBorderColor,
              borderStyle: 'solid',
              transform: `scale(${cardState.zoomLevel / 100})`,
              transformOrigin: 'top center'
            }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Render all elements */}
            {cardState.coreElements.map(renderElement)}
            {cardState.mobileElements.map(renderElement)}
            
            {/* Empty state message */}
            {cardState.coreElements.length === 0 && cardState.mobileElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-4">📄</div>
                  <div className="text-lg font-medium mb-2">Scheda Vuota</div>
                  <div className="text-sm">
                    Aggiungi elementi dal pannello laterale
                  </div>
                </div>
              </div>
            )}
            
            {/* Grid background for alignment */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3e%3cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23e5e7eb' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`,
                backgroundSize: '20px 20px'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Seleziona Template</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">Preview</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    {template.isDefault && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}