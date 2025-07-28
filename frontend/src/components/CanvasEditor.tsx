import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Palette, Save } from 'lucide-react';
import type { NavalUnit } from '../types/index.ts';
import TemplateManager, { type Template, CANVAS_SIZES } from './TemplateManager';

// Default templates for multi-template system
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'naval-card-standard',
    name: 'Scheda Navale Standard',
    description: 'Layout classico con logo, bandiera, silhouette e tabella caratteristiche',
    isDefault: true,
    canvasWidth: CANVAS_SIZES.A4_LANDSCAPE.width,
    canvasHeight: CANVAS_SIZES.A4_LANDSCAPE.height,
    canvasBackground: '#ffffff',
    canvasBorderWidth: 2,
    canvasBorderColor: '#000000',
    createdAt: new Date().toISOString(),
    elements: [
      {
        id: 'unit_class',
        type: 'unit_class',
        x: 160,
        y: 30,
        width: 400,
        height: 40,
        content: '[Inserire classe]',
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
        content: '[Inserire nome]',
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
        x: 983,
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
        width: 1083,
        height: 300,
        style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
      },
      {
        id: 'characteristics-table',
        type: 'table',
        x: 20,
        y: 500,
        width: 1083,
        height: 200,
        style: { backgroundColor: '#f3f4f6' },
        tableData: [
          ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
          ['MOTORI', 'XXX', 'RADAR', 'XXX'],
          ['ARMA', 'XXX', 'MITRAGLIERA', 'XXX']
        ]
      }
    ]
  },
  {
    id: 'naval-card-minimal',
    name: 'Scheda Navale Minimalista',
    description: 'Layout semplificato con solo silhouette e informazioni essenziali',
    isDefault: true,
    canvasWidth: CANVAS_SIZES.A4_LANDSCAPE.width,
    canvasHeight: CANVAS_SIZES.A4_LANDSCAPE.height,
    canvasBackground: '#f8fafc',
    canvasBorderWidth: 1,
    canvasBorderColor: '#e2e8f0',
    createdAt: new Date().toISOString(),
    elements: [
      {
        id: 'unit_name',
        type: 'unit_name',
        x: 50,
        y: 50,
        width: 1000,
        height: 80,
        content: '[Inserire nome]',
        isFixed: true,
        style: { fontSize: 32, fontWeight: 'bold', color: '#000', textAlign: 'center' }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 150,
        y: 200,
        width: 823,
        height: 400,
        style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 2, borderColor: '#1e40af', borderStyle: 'solid' }
      },
      {
        id: 'unit_class',
        type: 'unit_class',
        x: 50,
        y: 650,
        width: 1000,
        height: 50,
        content: 'Classe: [Inserire classe]',
        isFixed: true,
        style: { fontSize: 18, fontWeight: 'normal', color: '#374151' }
      }
    ]
  },
  {
    id: 'naval-card-detailed',
    name: 'Scheda Navale Dettagliata',
    description: 'Layout completo con sezioni multiple per informazioni estese',
    isDefault: true,
    canvasWidth: CANVAS_SIZES.A4_LANDSCAPE.width,
    canvasHeight: CANVAS_SIZES.A4_LANDSCAPE.height,
    canvasBackground: '#ffffff',
    canvasBorderWidth: 3,
    canvasBorderColor: '#1f2937',
    createdAt: new Date().toISOString(),
    elements: [
      {
        id: 'header-bg',
        type: 'text',
        x: 0,
        y: 0,
        width: 1123,
        height: 100,
        content: '',
        style: { backgroundColor: '#1f2937', borderRadius: 0 }
      },
      {
        id: 'logo',
        type: 'logo',
        x: 20,
        y: 20,
        width: 60,
        height: 60,
        style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#ffffff', borderStyle: 'solid' }
      },
      {
        id: 'unit_name',
        type: 'unit_name',
        x: 100,
        y: 25,
        width: 800,
        height: 25,
        content: '[Inserire nome]',
        isFixed: true,
        style: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' }
      },
      {
        id: 'unit_class',
        type: 'unit_class',
        x: 100,
        y: 55,
        width: 800,
        height: 25,
        content: '[Inserire classe]',
        isFixed: true,
        style: { fontSize: 16, fontWeight: 'normal', color: '#d1d5db' }
      },
      {
        id: 'flag',
        type: 'flag',
        x: 1043,
        y: 20,
        width: 60,
        height: 40,
        style: { backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 1, borderColor: '#ffffff', borderStyle: 'solid' }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 50,
        y: 120,
        width: 1023,
        height: 300,
        style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#374151', borderStyle: 'solid' }
      },
      {
        id: 'characteristics-table',
        type: 'table',
        x: 50,
        y: 450,
        width: 1023,
        height: 250,
        style: { backgroundColor: '#f9fafb' },
        tableData: [
          ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
          ['LUNGHEZZA', 'XXX m', 'LARGHEZZA', 'XXX m'],
          ['DISLOCAMENTO', 'XXX t', 'VELOCITÀ', 'XXX kn'],
          ['EQUIPAGGIO', 'XXX', 'ANNO', 'XXXX']
        ]
      }
    ]
  }
];
import { getImageUrl } from '../utils/imageUtils';
import { navalUnitsApi } from '../services/api';

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

// Default canvas dimensions (can be changed by templates)
const DEFAULT_CANVAS_WIDTH = CANVAS_SIZES.A4_LANDSCAPE.width;
const DEFAULT_CANVAS_HEIGHT = CANVAS_SIZES.A4_LANDSCAPE.height;

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

  // Initialize canvas properties from unit's layout_config
  const [canvasWidth, setCanvasWidth] = useState(
    unit?.layout_config?.canvasWidth || DEFAULT_CANVAS_WIDTH
  );
  const [canvasHeight, setCanvasHeight] = useState(
    unit?.layout_config?.canvasHeight || DEFAULT_CANVAS_HEIGHT
  );
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

  // Initialize other state variables
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [editingTableCell, setEditingTableCell] = useState<{elementId: string, row: number, col: number} | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [flagSearchTerm, setFlagSearchTerm] = useState('');
  const [customFlags, setCustomFlags] = useState<Array<{name: string, url: string}>>([]);
  
  // Multi-template support
  const [currentTemplateId, setCurrentTemplateId] = useState('naval-card-standard');
  const [allElementStates, setAllElementStates] = useState<{[templateId: string]: CanvasElement[]}>({});
  const [templateStatesLoaded, setTemplateStatesLoaded] = useState(false);
  const [allTemplates, setAllTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);

  // Load user templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('naval-templates');
    const userTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
    setAllTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
  }, []);

  // Auto-save current template state when elements change (debounced)
  useEffect(() => {
    if (!templateStatesLoaded || !unit?.id) return;
    
    const timer = setTimeout(() => {
      saveCurrentTemplateState();
    }, 1000); // Debounce by 1 second
    
    return () => clearTimeout(timer);
  }, [elements, canvasWidth, canvasHeight, canvasBackground, canvasBorderWidth, canvasBorderColor, templateStatesLoaded, unit?.id]);

  // Update elements when unit changes (e.g., when opening a different unit)
  useEffect(() => {
    if (!unit) {
      return;
    }
    
    if (unit?.layout_config?.elements && unit.layout_config.elements.length > 0) {
      // Force a completely new array with new objects to ensure React sees the change
      const newElements = unit.layout_config.elements.map(el => ({ ...el }));
      setElements(newElements);
      
    } else {
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
          x: DEFAULT_CANVAS_WIDTH - 140,
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
          width: DEFAULT_CANVAS_WIDTH - 40,
          height: 300,
          image: unit?.silhouette_path || undefined,
          style: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#000000', borderStyle: 'solid' }
        },
        {
          id: 'characteristics-table',
          type: 'table',
          x: 20,
          y: 500,
          width: DEFAULT_CANVAS_WIDTH - 40,
          height: 200,
          style: { backgroundColor: '#f3f4f6' },
          tableData: [
            ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
            ['MOTORI', 'XXX', 'RADAR', 'XXX'],
            ['ARMA', 'XXX', 'MITRAGLIERA', 'XXX']
          ]
        }
      ];
      setElements(defaultElements);
    }
  }, [unit?.id]);

  // Update canvas properties when unit changes
  useEffect(() => {
    if (unit?.layout_config) {
      setCanvasWidth(unit.layout_config.canvasWidth || DEFAULT_CANVAS_WIDTH);
      setCanvasHeight(unit.layout_config.canvasHeight || DEFAULT_CANVAS_HEIGHT);
      setCanvasBackground(unit.layout_config.canvasBackground || '#ffffff');
      setCanvasBorderWidth(unit.layout_config.canvasBorderWidth || 4);
      setCanvasBorderColor(unit.layout_config.canvasBorderColor || '#000000');
    } else {
      // Reset to defaults when no layout config exists
      setCanvasWidth(DEFAULT_CANVAS_WIDTH);
      setCanvasHeight(DEFAULT_CANVAS_HEIGHT);
      setCanvasBackground('#ffffff');
      setCanvasBorderWidth(4);
      setCanvasBorderColor('#000000');
    }
  }, [unit?.id]);

  // Load all template states for the unit
  useEffect(() => {
    const loadTemplateStates = async () => {
      if (!unit?.id) {
        setTemplateStatesLoaded(true);
        return;
      }
      
      try {
        const response = await navalUnitsApi.getAllTemplateStates(unit.id);
        const templateStates = response.template_states || {};
        
        // Convert template states to element states
        const elementStates: {[templateId: string]: CanvasElement[]} = {};
        
        Object.keys(templateStates).forEach(templateId => {
          const state = templateStates[templateId];
          if (state.element_states && Array.isArray(state.element_states)) {
            elementStates[templateId] = state.element_states;
          }
        });
        
        setAllElementStates(elementStates);
        
        // Set current template from unit data or use default
        const currentTemplate = unit.current_template_id || 'naval-card-standard';
        setCurrentTemplateId(currentTemplate);
        
        // Load elements for current template
        if (elementStates[currentTemplate]) {
          setElements(elementStates[currentTemplate]);
        } else {
          // Use elements from unit.layout_config if no saved state
          if (unit.layout_config?.elements) {
            setElements(unit.layout_config.elements);
          }
        }
        
        setTemplateStatesLoaded(true);
      } catch (error) {
        console.error('Error loading template states:', error);
        
        // Fallback: just use the current unit layout_config
        if (unit.layout_config?.elements) {
          setElements(unit.layout_config.elements);
        }
        
        // Set current template from unit data or use default
        const currentTemplate = unit.current_template_id || 'naval-card-standard';
        setCurrentTemplateId(currentTemplate);
        
        setTemplateStatesLoaded(true);
      }
    };

    loadTemplateStates();
  }, [unit?.id]);

  // Load user templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('naval-templates');
    const userTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
    setAllTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
  }, []);

  // Function to get nation from flag element
  const getNationFromFlag = (): string => {
    const flagElement = elements.find(el => el.type === 'flag' && el.image);
    if (!flagElement?.image) return unit?.nation || '';
    
    // Extract nation name from flag URL or find matching predefined flag
    const allFlags = [...PREDEFINED_FLAGS, ...customFlags];
    const matchingFlag = allFlags.find(flag => flag.url === flagElement.image);
    return matchingFlag?.name || unit?.nation || '';
  };

  // Save current template state
  const saveCurrentTemplateState = async () => {
    if (!unit?.id || !templateStatesLoaded) return;
    
    try {
      const stateData = {
        element_states: elements,
        canvas_config: {
          canvasWidth,
          canvasHeight,
          canvasBackground,
          canvasBorderWidth,
          canvasBorderColor
        }
      };
      
      await navalUnitsApi.saveTemplateState(unit.id, currentTemplateId, stateData);
      
      // Update local state
      setAllElementStates(prev => ({
        ...prev,
        [currentTemplateId]: elements
      }));
      
      console.log(`✅ Saved state for template: ${currentTemplateId}`);
    } catch (error) {
      console.error('Error saving template state:', error);
    }
  };

  // Change template
  const changeTemplate = async (newTemplateId: string) => {
    if (!unit?.id || !templateStatesLoaded) return;
    
    // Save current state first
    await saveCurrentTemplateState();
    
    // Preserve images from database
    const preservedImages = {
      logo: unit?.logo_path,
      flag: unit?.flag_path,
      silhouette: unit?.silhouette_path
    };
    
    // Load new template state
    if (allElementStates[newTemplateId]) {
      // Load saved state but ensure images from database are preserved
      const savedElements = allElementStates[newTemplateId].map(el => {
        const newEl = { ...el };
        
        // Always use database images as primary source
        if (el.type === 'logo' && preservedImages.logo) {
          newEl.image = preservedImages.logo;
        } else if (el.type === 'flag' && preservedImages.flag) {
          newEl.image = preservedImages.flag;
        } else if (el.type === 'silhouette' && preservedImages.silhouette) {
          newEl.image = preservedImages.silhouette;
        }
        
        return newEl;
      });
      
      setElements(savedElements);
    } else {
      // Create default elements for new template
      const template = allTemplates.find(t => t.id === newTemplateId);
      if (template) {
        // Use template default elements but preserve existing content AND images
        const newElements = template.elements.map(el => {
          // Try to find matching element in current elements to preserve content
          const existingElement = elements.find(existing => existing.type === el.type);
          
          const newEl = { ...el };
          
          // Preserve content from existing elements
          if (existingElement) {
            newEl.content = existingElement.content;
            newEl.tableData = existingElement.tableData;
          }
          
          // Always use database images as primary source
          if (el.type === 'logo' && preservedImages.logo) {
            newEl.image = preservedImages.logo;
          } else if (el.type === 'flag' && preservedImages.flag) {
            newEl.image = preservedImages.flag;
          } else if (el.type === 'silhouette' && preservedImages.silhouette) {
            newEl.image = preservedImages.silhouette;
          } else if (existingElement?.image) {
            // Fallback to existing element image if no database image
            newEl.image = existingElement.image;
          }
          
          return newEl;
        });
        
        // Preserve any custom elements that don't exist in the new template
        const customElements = elements.filter(currentEl => {
          const isCustomElement = !template.elements.some(templateEl => templateEl.type === currentEl.type);
          const isNotFixed = !currentEl.isFixed && currentEl.type !== 'unit_name' && currentEl.type !== 'unit_class';
          return isCustomElement && isNotFixed;
        });
        
        setElements([...newElements, ...customElements]);
        
        console.log(`✨ Preserved ${customElements.length} custom elements when switching template`);
        
        // Set canvas config from template
        setCanvasWidth(template.canvasWidth || DEFAULT_CANVAS_WIDTH);
        setCanvasHeight(template.canvasHeight || DEFAULT_CANVAS_HEIGHT);
        setCanvasBackground(template.canvasBackground || '#ffffff');
        setCanvasBorderWidth(template.canvasBorderWidth || 4);
        setCanvasBorderColor(template.canvasBorderColor || '#000000');
      }
    }
    
    setCurrentTemplateId(newTemplateId);
    console.log(`🔄 Switched to template: ${newTemplateId} with preserved images`);
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

  const applyTemplate = (template: Template, preserveContent = false) => {
    // Preserve images from database
    const preservedImages = {
      logo: unit?.logo_path,
      flag: unit?.flag_path,
      silhouette: unit?.silhouette_path
    };

    if (preserveContent) {
      // Preserve content from existing elements when applying template format
      const currentContent = new Map();
      elements.forEach(el => {
        if (el.content) currentContent.set(el.type, el.content);
        if (el.image) currentContent.set(`${el.type}_image`, el.image);
        if (el.tableData) currentContent.set(`${el.type}_table`, el.tableData);
      });

      // Preserve custom elements that don't exist in the new template
      const customElements = elements.filter(currentEl => {
        const isCustomElement = !template.elements.some(templateEl => templateEl.type === currentEl.type);
        const isNotFixed = !currentEl.isFixed && currentEl.type !== 'unit_name' && currentEl.type !== 'unit_class';
        return isCustomElement && isNotFixed;
      });

      const updatedElements = template.elements.map(templateEl => {
        const preservedElement = { ...templateEl };
        
        // Preserve content for same type elements
        if (currentContent.has(templateEl.type)) {
          preservedElement.content = currentContent.get(templateEl.type);
        }
        if (currentContent.has(`${templateEl.type}_table`)) {
          preservedElement.tableData = currentContent.get(`${templateEl.type}_table`);
        }

        // Always use database images as primary source
        if (templateEl.type === 'logo' && preservedImages.logo) {
          preservedElement.image = preservedImages.logo;
        } else if (templateEl.type === 'flag' && preservedImages.flag) {
          preservedElement.image = preservedImages.flag;
        } else if (templateEl.type === 'silhouette' && preservedImages.silhouette) {
          preservedElement.image = preservedImages.silhouette;
        } else if (currentContent.has(`${templateEl.type}_image`)) {
          // Fallback to existing element image if no database image
          preservedElement.image = currentContent.get(`${templateEl.type}_image`);
        }

        // Always preserve unit name and class content
        if (templateEl.type === 'unit_name' && unit?.name) {
          preservedElement.content = unit.name;
        }
        if (templateEl.type === 'unit_class' && unit?.unit_class) {
          preservedElement.content = unit.unit_class;
        }

        return preservedElement;
      });

      setElements([...updatedElements, ...customElements]);
      console.log(`✨ Applied template with ${customElements.length} preserved custom elements`);
    } else {
      // Standard template application - replace everything but preserve database images
      const newElements = template.elements.map(el => {
        const newEl = { ...el };
        
        // Always use database images as primary source
        if (el.type === 'logo' && preservedImages.logo) {
          newEl.image = preservedImages.logo;
        } else if (el.type === 'flag' && preservedImages.flag) {
          newEl.image = preservedImages.flag;
        } else if (el.type === 'silhouette' && preservedImages.silhouette) {
          newEl.image = preservedImages.silhouette;
        }
        
        // Still preserve unit name and class from actual unit data
        if (el.type === 'unit_name' && unit?.name) {
          newEl.content = unit.name;
        }
        if (el.type === 'unit_class' && unit?.unit_class) {
          newEl.content = unit.unit_class;
        }
        return newEl;
      });
      setElements(newElements);
    }

    // Apply canvas settings from template
    if (template.canvasWidth) setCanvasWidth(template.canvasWidth);
    if (template.canvasHeight) setCanvasHeight(template.canvasHeight);
    if (template.canvasBackground) setCanvasBackground(template.canvasBackground);
    if (template.canvasBorderWidth !== undefined) setCanvasBorderWidth(template.canvasBorderWidth);
    if (template.canvasBorderColor) setCanvasBorderColor(template.canvasBorderColor);

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

          {/* Template Selector */}
          {templateStatesLoaded && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Template Attivo</h3>
              <div className="space-y-2">
                <select
                  value={currentTemplateId}
                  onChange={(e) => changeTemplate(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {allTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} {!template.isDefault ? '(Personalizzato)' : ''}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  {allTemplates.find(t => t.id === currentTemplateId)?.description}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  ✨ Gli elementi vengono nascosti/mostrati, non eliminati
                </div>
              </div>
            </div>
          )}

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
                onClick={async () => {
                  // Save current template state first
                  await saveCurrentTemplateState();
                  
                  onSave({ 
                    elements, 
                    canvasWidth, 
                    canvasHeight, 
                    canvasBackground, 
                    canvasBorderWidth, 
                    canvasBorderColor, 
                    nation: getNationFromFlag(),
                    current_template_id: currentTemplateId
                  });
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
            onTemplatesUpdate={() => {
              // Reload templates when they're updated
              const savedTemplates = localStorage.getItem('naval-templates');
              const userTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
              setAllTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
            }}
            currentElements={elements}
            currentCanvasWidth={canvasWidth}
            currentCanvasHeight={canvasHeight}
            currentCanvasBackground={canvasBackground}
            currentCanvasBorderWidth={canvasBorderWidth}
            currentCanvasBorderColor={canvasBorderColor}
          />
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-auto max-h-screen">
          {/* Zoom Controls */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.25, prev - 0.25))}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
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
            
            <div className="text-sm text-gray-500">
              Canvas: {canvasWidth} × {canvasHeight}px
            </div>
          </div>
          <div 
            style={{ 
              width: canvasWidth * zoomLevel, 
              height: canvasHeight * zoomLevel,
              overflow: 'visible'
            }}
          >
            <div
              ref={canvasRef}
              className="relative"
              style={{ 
                width: canvasWidth, 
                height: canvasHeight,
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