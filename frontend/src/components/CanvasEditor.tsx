import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Palette, Save, Upload } from 'lucide-react';
import type { NavalUnit } from '../types/index.ts';
import TemplateManager, { type Template } from './TemplateManager';
import { getImageUrl } from '../utils/imageUtils';

interface CanvasElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'text' | 'table' | 'unit_name' | 'unit_class';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  image?: string;
  tableData?: string[][];
  isFixed?: boolean; // For unit_name and unit_class fields
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

interface CanvasEditorProps {
  unit?: NavalUnit | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const CANVAS_WIDTH = 1123; // A4 landscape at 96 DPI: 11.7" * 96
const CANVAS_HEIGHT = 794;  // A4 landscape at 96 DPI: 8.3" * 96

// Predefined flags
const PREDEFINED_FLAGS = [
  // Europa
  { name: 'Italia', url: 'https://flagcdn.com/w320/it.png' },
  { name: 'Francia', url: 'https://flagcdn.com/w320/fr.png' },
  { name: 'Germania', url: 'https://flagcdn.com/w320/de.png' },
  { name: 'Regno Unito', url: 'https://flagcdn.com/w320/gb.png' },
  { name: 'Spagna', url: 'https://flagcdn.com/w320/es.png' },
  { name: 'Grecia', url: 'https://flagcdn.com/w320/gr.png' },
  { name: 'Olanda', url: 'https://flagcdn.com/w320/nl.png' },
  { name: 'Belgio', url: 'https://flagcdn.com/w320/be.png' },
  { name: 'Portogallo', url: 'https://flagcdn.com/w320/pt.png' },
  { name: 'Norvegia', url: 'https://flagcdn.com/w320/no.png' },
  { name: 'Danimarca', url: 'https://flagcdn.com/w320/dk.png' },
  { name: 'Svezia', url: 'https://flagcdn.com/w320/se.png' },
  { name: 'Finlandia', url: 'https://flagcdn.com/w320/fi.png' },
  { name: 'Polonia', url: 'https://flagcdn.com/w320/pl.png' },
  { name: 'Austria', url: 'https://flagcdn.com/w320/at.png' },
  { name: 'Svizzera', url: 'https://flagcdn.com/w320/ch.png' },
  
  // America
  { name: 'USA', url: 'https://flagcdn.com/w320/us.png' },
  { name: 'Canada', url: 'https://flagcdn.com/w320/ca.png' },
  { name: 'Messico', url: 'https://flagcdn.com/w320/mx.png' },
  { name: 'Brasile', url: 'https://flagcdn.com/w320/br.png' },
  { name: 'Argentina', url: 'https://flagcdn.com/w320/ar.png' },
  { name: 'Cile', url: 'https://flagcdn.com/w320/cl.png' },
  { name: 'Colombia', url: 'https://flagcdn.com/w320/co.png' },
  { name: 'Venezuela', url: 'https://flagcdn.com/w320/ve.png' },
  
  // Asia
  { name: 'Giappone', url: 'https://flagcdn.com/w320/jp.png' },
  { name: 'Cina', url: 'https://flagcdn.com/w320/cn.png' },
  { name: 'India', url: 'https://flagcdn.com/w320/in.png' },
  { name: 'Corea del Sud', url: 'https://flagcdn.com/w320/kr.png' },
  { name: 'Thailandia', url: 'https://flagcdn.com/w320/th.png' },
  { name: 'Singapore', url: 'https://flagcdn.com/w320/sg.png' },
  { name: 'Malaysia', url: 'https://flagcdn.com/w320/my.png' },
  { name: 'Indonesia', url: 'https://flagcdn.com/w320/id.png' },
  { name: 'Filippine', url: 'https://flagcdn.com/w320/ph.png' },
  { name: 'Vietnam', url: 'https://flagcdn.com/w320/vn.png' },
  
  // Medio Oriente & Africa
  { name: 'Turchia', url: 'https://flagcdn.com/w320/tr.png' },
  { name: 'Israele', url: 'https://flagcdn.com/w320/il.png' },
  { name: 'Egitto', url: 'https://flagcdn.com/w320/eg.png' },
  { name: 'Sud Africa', url: 'https://flagcdn.com/w320/za.png' },
  { name: 'Marocco', url: 'https://flagcdn.com/w320/ma.png' },
  { name: 'Arabia Saudita', url: 'https://flagcdn.com/w320/sa.png' },
  { name: 'Emirati Arabi', url: 'https://flagcdn.com/w320/ae.png' },
  
  // Oceania
  { name: 'Australia', url: 'https://flagcdn.com/w320/au.png' },
  { name: 'Nuova Zelanda', url: 'https://flagcdn.com/w320/nz.png' },
  
  // Europa Orientale
  { name: 'Russia', url: 'https://flagcdn.com/w320/ru.png' },
  { name: 'Ucraina', url: 'https://flagcdn.com/w320/ua.png' },
  { name: 'Romania', url: 'https://flagcdn.com/w320/ro.png' },
  { name: 'Bulgaria', url: 'https://flagcdn.com/w320/bg.png' },
  { name: 'Croazia', url: 'https://flagcdn.com/w320/hr.png' },
  { name: 'Serbia', url: 'https://flagcdn.com/w320/rs.png' },
  
  // Organizzazioni
  { name: 'NATO', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/320px-Flag_of_NATO.svg.png' },
  { name: 'Unione Europea', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/320px-Flag_of_Europe.svg.png' },
  { name: 'ONU', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/320px-Flag_of_the_United_Nations.svg.png' }
];

export default function CanvasEditor({ unit, onSave, onCancel }: CanvasEditorProps) {
  // Initialize elements state - start with empty and let useEffect handle the initialization
  const [elements, setElements] = useState<CanvasElement[]>([]);

  // Update elements when unit changes (e.g., when opening a different unit)
  useEffect(() => {
    console.log('🔍 useEffect triggered - unit ID:', unit?.id, 'layout_config exists:', !!unit?.layout_config?.elements);
    console.log('🔍 Full unit object:', unit);
    
    if (!unit) {
      console.log('🔍 No unit provided');
      return;
    }
    
    if (unit?.layout_config?.elements && unit.layout_config.elements.length > 0) {
      console.log('🔍 Found layout_config elements:', unit.layout_config.elements);
      console.log('🔍 Current elements state before update:', elements);
      
      // Force a completely new array with new objects to ensure React sees the change
      const newElements = unit.layout_config.elements.map(el => ({ ...el }));
      console.log('🔍 Setting new elements:', newElements);
      setElements(newElements);
      
      console.log('🔍 Elements state update completed');
    } else {
      console.log('🔍 Creating default template for unit:', unit.id);
      // Create default template with existing image paths if available
      const defaultElements = [
        // Fixed fields that always remain
        {
          id: 'unit_class',
          type: 'unit_class',
          x: 160,
          y: 30,
          width: 400,
          height: 40,
          content: unit?.unit_class || '[Inserire classe]',
          isFixed: true,
          style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
        },
        {
          id: 'unit_name',
          type: 'unit_name',
          x: 160,
          y: 80,
          width: 400,
          height: 40,
          content: unit?.name || '[Inserire nome]',
          isFixed: true,
          style: { fontSize: 20, fontWeight: 'bold', color: '#000' }
        },
        // Default template elements
        {
          id: 'logo',
          type: 'logo',
          x: 20,
          y: 20,
          width: 120,
          height: 120,
          image: unit?.logo_path || undefined,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        {
          id: 'flag',
          type: 'flag', 
          x: CANVAS_WIDTH - 140,
          y: 20,
          width: 120,
          height: 80,
          image: unit?.flag_path || undefined,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        {
          id: 'silhouette',
          type: 'silhouette',
          x: 20,
          y: 180,
          width: CANVAS_WIDTH - 40,
          height: 300,
          image: unit?.silhouette_path || undefined,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        {
          id: 'characteristics-table',
          type: 'table',
          x: 20,
          y: 500,
          width: CANVAS_WIDTH - 40,
          height: 200,
          style: { backgroundColor: '#f3f4f6' },
          tableData: [
            ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
            ['MOTORI', 'XXX', 'RADAR', 'XXX'],
            ['ARMA', 'XXX', 'MITRAGLIERA', 'XXX']
          ]
        }
      ];
      console.log('🔍 Setting default elements:', defaultElements);
      setElements(defaultElements);
    }
  }, [unit?.id]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [editingTableCell, setEditingTableCell] = useState<{elementId: string, row: number, col: number} | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [flagSearchTerm, setFlagSearchTerm] = useState('');
  const [customFlags, setCustomFlags] = useState<Array<{name: string, url: string}>>([]);
  
  // Initialize canvas properties from unit's layout_config
  const [canvasBackground, setCanvasBackground] = useState(
    unit?.layout_config?.canvasBackground || '#ffffff'
  );
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(
    unit?.layout_config?.canvasBorderWidth || 4
  );
  const [canvasBorderColor, setCanvasBorderColor] = useState(
    unit?.layout_config?.canvasBorderColor || '#000000'
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [nationUpdateKey, setNationUpdateKey] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Function to get nation from flag element
  const getNationFromFlag = (): string => {
    const flagElement = elements.find(el => el.type === 'flag' && el.image);
    if (!flagElement?.image) return unit?.nation || '';
    
    // Extract nation name from flag URL or find matching predefined flag
    const allFlags = [...PREDEFINED_FLAGS, ...customFlags];
    const matchingFlag = allFlags.find(flag => flag.url === flagElement.image);
    return matchingFlag?.name || unit?.nation || '';
  };

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

    setElements(prev => prev.map(el => {
      if (el.id === selectedElement) {
        let newX = Math.max(0, el.x + deltaX);
        let newY = Math.max(0, el.y + deltaY);

        // Magnetic alignment - snap to other elements (reduced from 10 to 5)
        const SNAP_DISTANCE = 5;
        const currentElement = { ...el, x: newX, y: newY };

        prev.forEach(otherEl => {
          if (otherEl.id !== selectedElement) {
            // Snap to left edge
            if (Math.abs(newX - otherEl.x) < SNAP_DISTANCE) {
              newX = otherEl.x;
            }
            // Snap to right edge
            if (Math.abs(newX - (otherEl.x + otherEl.width)) < SNAP_DISTANCE) {
              newX = otherEl.x + otherEl.width;
            }
            // Snap to top edge
            if (Math.abs(newY - otherEl.y) < SNAP_DISTANCE) {
              newY = otherEl.y;
            }
            // Snap to bottom edge
            if (Math.abs(newY - (otherEl.y + otherEl.height)) < SNAP_DISTANCE) {
              newY = otherEl.y + otherEl.height;
            }
            // Snap to center alignment (horizontal)
            if (Math.abs((newX + el.width/2) - (otherEl.x + otherEl.width/2)) < SNAP_DISTANCE) {
              newX = otherEl.x + otherEl.width/2 - el.width/2;
            }
            // Snap to center alignment (vertical)
            if (Math.abs((newY + el.height/2) - (otherEl.y + otherEl.height/2)) < SNAP_DISTANCE) {
              newY = otherEl.y + otherEl.height/2 - el.height/2;
            }
          }
        });

        return { ...el, x: newX, y: newY };
      }
      return el;
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, selectedElement, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleImageUpload = async (elementId: string, file: File) => {
    try {
      // Determine element type for appropriate subfolder
      const element = elements.find(el => el.id === elementId);
      const elementType = element?.type || 'general';
      
      // Upload to backend with appropriate subfolder
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
      // Store only the relative path, getImageUrl will convert it to absolute URL
      const imagePath = data.file_path;
      
      setElements(prev => prev.map(el => 
        el.id === elementId ? { ...el, image: imagePath } : el
      ));
      
      // Force re-render of nation detection if it's a flag
      if (element?.type === 'flag') {
        setNationUpdateKey(prev => prev + 1);
      }
      
      console.log('✅ Image uploaded successfully:', imagePath);
      
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      alert('Errore durante l\'upload dell\'immagine');
    }
  };

  const handleCustomFlagUpload = async (file: File) => {
    try {
      // Upload to backend with flags subfolder
      const formData = new FormData();
      formData.append('image', file);
      formData.append('subfolder', 'flags');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      // Use getImageUrl to convert relative path to absolute URL for display
      const imagePath = getImageUrl(data.file_path);
      const flagName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
      const newFlag = { name: flagName, url: imagePath };
      
      setCustomFlags(prev => [...prev, newFlag]);
      console.log('✅ Custom flag uploaded successfully:', imagePath);
      
    } catch (error) {
      console.error('❌ Flag upload failed:', error);
      alert('Errore durante l\'upload della bandiera');
    }
  };

  const getFilteredFlags = () => {
    const allFlags = [...PREDEFINED_FLAGS, ...customFlags];
    if (!flagSearchTerm) return allFlags;
    return allFlags.filter(flag => 
      flag.name.toLowerCase().includes(flagSearchTerm.toLowerCase())
    );
  };

  const handleTextEdit = (elementId: string, newText: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content: newText } : el
    ));
  };

  const applyTemplate = (template: Template) => {
    setElements(template.elements.map(el => ({ ...el })));
    setSelectedElement(null);
    setShowTemplateManager(false);
  };

  const deleteElement = (elementId: string) => {
    // Don't allow deletion of fixed fields
    const element = elements.find(el => el.id === elementId);
    if (element?.isFixed || element?.type === 'unit_name' || element?.type === 'unit_class') {
      return;
    }
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const updateTableCell = (elementId: string, row: number, col: number, value: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId && el.tableData) {
        const newTableData = [...el.tableData];
        if (!newTableData[row]) newTableData[row] = [];
        newTableData[row][col] = value;
        return { ...el, tableData: newTableData };
      }
      return el;
    }));
  };

  const addTableRow = (elementId: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId && el.tableData) {
        const cols = el.tableData[0]?.length || 4;
        const newRow = Array(cols).fill('');
        return { ...el, tableData: [...el.tableData, newRow] };
      }
      return el;
    }));
  };

  const removeTableRow = (elementId: string, rowIndex: number) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId && el.tableData && el.tableData.length > 1) {
        return { ...el, tableData: el.tableData.filter((_, i) => i !== rowIndex) };
      }
      return el;
    }));
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement === element.id;
    const isFixed = element.isFixed || element.type === 'unit_name' || element.type === 'unit_class';
    
    // Debug: log actual rendering values with more detail
    console.log(`🔍 Rendering element ${element.type} (${element.id}): x=${element.x}, y=${element.y}, width=${element.width}, height=${element.height}`);
    console.log(`🔍 Element object:`, element);
    
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
            Campo Fisso
          </div>
        )}
        {/* Content based on element type */}
        {(element.type === 'text' || element.type === 'unit_name' || element.type === 'unit_class') && (
          <div
            className="w-full h-full flex items-center px-2 cursor-move"
            style={{
              fontSize: element.style?.fontSize || 16,
              fontWeight: element.style?.fontWeight || 'normal',
              fontStyle: element.style?.fontStyle || 'normal',
              fontFamily: element.style?.fontFamily || 'Arial',
              color: element.style?.color || '#000000',
              textDecoration: element.style?.textDecoration || 'none',
              textAlign: element.style?.textAlign || 'left',
              justifyContent: element.style?.textAlign === 'center' ? 'center' : 
                             element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
              whiteSpace: element.style?.whiteSpace as any,
            }}
            onMouseDown={(e) => handleMouseDown(element.id, e)}
          >
            {isSelected ? (
              <textarea
                value={element.content || ''}
                onChange={(e) => handleTextEdit(element.id, e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{
                  fontSize: element.style?.fontSize || 16,
                  fontWeight: element.style?.fontWeight || 'normal',
                  fontStyle: element.style?.fontStyle || 'normal',
                  fontFamily: element.style?.fontFamily || 'Arial',
                  color: element.style?.color || '#000000',
                  textDecoration: element.style?.textDecoration || 'none',
                  textAlign: element.style?.textAlign || 'left',
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div style={{ 
                whiteSpace: 'pre-line',
                width: '100%',
                textAlign: element.style?.textAlign || 'left'
              }}>
                {element.content}
              </div>
            )}
          </div>
        )}

        {(element.type === 'logo' || element.type === 'silhouette') && (
          <div 
            className="w-full h-full flex items-center justify-center cursor-move"
            onMouseDown={(e) => handleMouseDown(element.id, e)}
          >
            {element.image ? (
              <img
                src={getImageUrl(element.image)}
                alt={element.type}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-white text-center text-sm font-bold">
                {element.type === 'logo' && 'LOGO'}
                {element.type === 'silhouette' && 'SILHOUETTE NAVE'}
              </div>
            )}
            {isSelected && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(element.id, e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}

        {element.type === 'flag' && (
          <div 
            className="w-full h-full flex items-center justify-center cursor-move"
            onMouseDown={(e) => handleMouseDown(element.id, e)}
          >
            {element.image ? (
              <img
                src={getImageUrl(element.image)}
                alt="Flag"
                className="max-w-full max-h-full object-cover"
              />
            ) : (
              <div className="text-white text-center text-sm font-bold">BANDIERA</div>
            )}
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFlagSelector(true);
                }}
                className="absolute inset-0 bg-blue-500 bg-opacity-20 text-white text-xs font-bold flex items-center justify-center"
              >
                Scegli Bandiera
              </button>
            )}
          </div>
        )}

        {element.type === 'table' && (
          <div 
            className="w-full h-full bg-white border border-gray-400 cursor-move overflow-auto"
            onMouseDown={(e) => handleMouseDown(element.id, e)}
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold">CARATTERISTICHE</div>
                {isSelected && (
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addTableRow(element.id);
                      }}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      + Riga
                    </button>
                  </div>
                )}
              </div>
              
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTableCell({ elementId: element.id, row: rowIndex, col: colIndex });
                          }}
                        >
                          {editingTableCell?.elementId === element.id && 
                           editingTableCell?.row === rowIndex && 
                           editingTableCell?.col === colIndex ? (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => updateTableCell(element.id, rowIndex, colIndex, e.target.value)}
                              className="w-full bg-transparent text-xs border-none outline-none"
                              autoFocus
                              onBlur={() => setEditingTableCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingTableCell(null);
                                }
                              }}
                            />
                          ) : (
                            <span>{cell}</span>
                          )}
                        </div>
                      );
                    })}
                    {isSelected && rowIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTableRow(element.id, rowIndex);
                        }}
                        className="text-xs bg-red-500 text-white px-1 py-1 ml-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resize handles for selected element */}
        {isSelected && (
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
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto max-h-screen">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Editor Scheda Navale</h2>
          
          {/* Canvas Controls */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Controlli Canvas</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  -
                </button>
                <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  100%
                </button>
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

          {/* Auto-detected Nation */}
          <div key={nationUpdateKey} className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Nazione Rilevata</h3>
            <div className="text-sm text-gray-600">
              {getNationFromFlag() || 'Aggiungi una bandiera per rilevare automaticamente la nazione'}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <button
              onClick={() => setShowTemplateManager(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Palette className="h-4 w-4 mr-2" />
              Gestisci Template
            </button>
            <div className="flex space-x-2">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  console.log('🔍 CanvasEditor saving elements:', elements);
                  onSave({ elements, canvasBackground, canvasBorderWidth, canvasBorderColor, nation: getNationFromFlag() });
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Salva
              </button>
            </div>
          </div>
        </div>

        {selectedElement && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Proprietà Elemento</h3>
            {(() => {
              const element = elements.find(el => el.id === selectedElement);
              if (!element) return null;

              return (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <div className="text-sm text-gray-600 capitalize">{element.type}</div>
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
                      
                      {/* Font Family */}
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
                        {/* Font Size */}
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

                        {/* Text Color */}
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

                      {/* Text Formatting */}
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

                      {/* Text Alignment */}
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
                    </>
                  )}

                  {(element.type === 'unit_name' || element.type === 'unit_class') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {element.type === 'unit_name' ? 'Nome Unità' : 'Classe Unità'}
                        </label>
                        <input
                          type="text"
                          value={element.content || ''}
                          onChange={(e) => handleTextEdit(element.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder={element.type === 'unit_name' ? 'Inserisci nome unità...' : 'Inserisci classe unità...'}
                        />
                      </div>
                      
                      {/* Font controls for fixed fields */}
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
                            value={element.style?.fontSize || 20}
                            onChange={(e) => setElements(prev => prev.map(el => 
                              el.id === selectedElement 
                                ? { ...el, style: { ...el.style, fontSize: parseInt(e.target.value) || 20 } }
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
                    </>
                  )}

                  {(element.type === 'logo' || element.type === 'flag' || element.type === 'silhouette') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carica Immagine</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(element.id, e.target.files[0])}
                        className="w-full text-sm"
                      />
                    </div>
                  )}

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
                          value={element.style?.borderWidth || 2}
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

                  {/* Only show delete button for non-fixed elements */}
                  {!element.isFixed && element.type !== 'unit_name' && element.type !== 'unit_class' && (
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
                const newElement: CanvasElement = {
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
                const newElement: CanvasElement = {
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
                const newElement: CanvasElement = {
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
                const newElement: CanvasElement = {
                  id: `table-${Date.now()}`,
                  type: 'table',
                  x: 100,
                  y: 400,
                  width: 400,
                  height: 150,
                  style: { backgroundColor: '#f9fafb' },
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
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Importa Template</h4>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const template = JSON.parse(event.target?.result as string);
                        applyTemplate(template);
                      } catch (error) {
                        alert('Errore nel caricamento del template');
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
                className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Flag Selector Modal */}
        {showFlagSelector && selectedElement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-gray-900">Scegli Bandiera</h3>
                <span className="text-sm text-gray-500">{getFilteredFlags().length} bandiere disponibili</span>
              </div>
              
              {/* Search and Upload Controls */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cerca bandiera</label>
                  <input
                    type="text"
                    value={flagSearchTerm}
                    onChange={(e) => setFlagSearchTerm(e.target.value)}
                    placeholder="Digita il nome della nazione..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carica bandiera personalizzata</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCustomFlagUpload(file);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    className="w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-2">
                {getFilteredFlags().map((flag) => (
                  <button
                    key={flag.name}
                    onClick={() => {
                      setElements(prev => prev.map(el => 
                        el.id === selectedElement ? { ...el, image: flag.url } : el
                      ));
                      setShowFlagSelector(false);
                      setFlagSearchTerm(''); // Reset search term
                    }}
                    className="p-2 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 group relative"
                    title={flag.name}
                  >
                    <img
                      src={flag.url}
                      alt={flag.name}
                      className="w-full h-8 object-cover rounded mb-1 group-hover:scale-105 transition-transform"
                    />
                    <div className="text-xs text-center text-gray-700 truncate">{flag.name}</div>
                    {customFlags.includes(flag) && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                        Custom
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2 border-t border-gray-200 pt-4">
                <button
                  onClick={() => {
                    setShowFlagSelector(false);
                    setFlagSearchTerm(''); // Reset search term
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <TemplateManager
            onSelectTemplate={applyTemplate}
            onClose={() => setShowTemplateManager(false)}
            currentElements={elements}
          />
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-auto max-h-screen">
          <div 
            style={{ 
              width: CANVAS_WIDTH * zoomLevel, 
              height: CANVAS_HEIGHT * zoomLevel,
              overflow: 'visible'
            }}
          >
            <div
              ref={canvasRef}
              className="relative"
              style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT,
                backgroundColor: canvasBackground,
                borderWidth: canvasBorderWidth,
                borderColor: canvasBorderColor,
                borderStyle: 'solid',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
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

      {/* Flag Selector Modal */}
      {showFlagSelector && selectedElement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Seleziona Bandiera</h2>
              <button
                onClick={() => setShowFlagSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Cerca bandiera..."
                  value={flagSearchTerm}
                  onChange={(e) => setFlagSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Flags Grid */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {getFilteredFlags().map((flag, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setElements(prev => prev.map(el => 
                        el.id === selectedElement 
                          ? { ...el, image: flag.url }
                          : el
                      ));
                      setNationUpdateKey(prev => prev + 1); // Force re-render of nation detection
                      setShowFlagSelector(false);
                    }}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <img
                      src={flag.url}
                      alt={flag.name}
                      className="w-12 h-8 object-cover rounded border"
                    />
                    <span className="text-xs font-medium text-gray-700 mt-2 text-center">
                      {flag.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}