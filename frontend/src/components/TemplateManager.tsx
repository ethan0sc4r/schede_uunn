import React, { useState, useEffect } from 'react';
import { Save, Download, Trash2, Copy } from 'lucide-react';
import { templatesApi } from '../services/api';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  elements: any[];
  canvasWidth?: number;
  canvasHeight?: number;
  canvasBackground?: string;
  canvasBorderWidth?: number;
  canvasBorderColor?: string;
  createdAt: string;
  isDefault?: boolean;
}

interface TemplateManagerProps {
  onSelectTemplate: (template: Template, preserveContent?: boolean) => void;
  onClose: () => void;
  onTemplatesUpdate?: () => void;
  currentElements: any[];
  currentCanvasWidth?: number;
  currentCanvasHeight?: number;
  currentCanvasBackground?: string;
  currentCanvasBorderWidth?: number;
  currentCanvasBorderColor?: string;
}

// Dimensioni foglio standard
export const CANVAS_SIZES = {
  A4_LANDSCAPE: { width: 1123, height: 794, name: 'A4 Orizzontale' },
  A4_PORTRAIT: { width: 794, height: 1123, name: 'A4 Verticale' },
  A3_LANDSCAPE: { width: 1587, height: 1123, name: 'A3 Orizzontale' },
  A3_PORTRAIT: { width: 1123, height: 1587, name: 'A3 Verticale' },
  CUSTOM: { width: 1200, height: 800, name: 'Personalizzato' },
  PRESENTATION: { width: 1280, height: 720, name: 'Presentazione (16:9)' }
};

// Template predefiniti
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
        id: 'logo',
        type: 'logo',
        x: 20,
        y: 20,
        width: 120,
        height: 120,
        style: { backgroundColor: '#0f766e', borderRadius: 8 }
      },
      {
        id: 'flag',
        type: 'flag',
        x: 983,
        y: 20,
        width: 120,
        height: 80,
        style: { backgroundColor: '#0f766e', borderRadius: 8 }
      },
      {
        id: 'unit-info',
        type: 'text',
        x: 160,
        y: 30,
        width: 600,
        height: 120,
        content: 'CLASSE UNITA\'\nNOME UNITA\' NAVALE',
        style: { fontSize: 24, fontWeight: 'bold', color: '#000', whiteSpace: 'pre-line' }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 20,
        y: 180,
        width: 1083,
        height: 300,
        style: { backgroundColor: '#0f766e', borderRadius: 8 }
      },
      {
        id: 'characteristics-table',
        type: 'table',
        x: 20,
        y: 500,
        width: 1083,
        height: 200,
        style: { backgroundColor: '#f3f4f6' }
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
        id: 'unit-title',
        type: 'text',
        x: 50,
        y: 50,
        width: 1000,
        height: 80,
        content: 'NOME UNITA\' NAVALE',
        style: { fontSize: 32, fontWeight: 'bold', color: '#000', textAlign: 'center' }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 150,
        y: 200,
        width: 823,
        height: 400,
        style: { backgroundColor: '#1e40af', borderRadius: 12 }
      },
      {
        id: 'info-box',
        type: 'text',
        x: 50,
        y: 650,
        width: 1000,
        height: 100,
        content: 'Classe: [Inserire classe]\nNazione: [Inserire nazione]',
        style: { fontSize: 18, fontWeight: 'normal', color: '#374151', whiteSpace: 'pre-line' }
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
        style: { backgroundColor: '#ffffff', borderRadius: 8 }
      },
      {
        id: 'title',
        type: 'text',
        x: 100,
        y: 25,
        width: 800,
        height: 50,
        content: 'NOME UNITA\' NAVALE - CLASSE',
        style: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' }
      },
      {
        id: 'flag',
        type: 'flag',
        x: 1043,
        y: 20,
        width: 60,
        height: 40,
        style: { backgroundColor: '#ffffff', borderRadius: 4 }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 50,
        y: 120,
        width: 1023,
        height: 250,
        style: { backgroundColor: '#3b82f6', borderRadius: 8 }
      },
      {
        id: 'specs-left',
        type: 'table',
        x: 50,
        y: 400,
        width: 500,
        height: 150,
        style: { backgroundColor: '#f9fafb' }
      },
      {
        id: 'specs-right',
        type: 'table',
        x: 573,
        y: 400,
        width: 500,
        height: 150,
        style: { backgroundColor: '#f9fafb' }
      },
      {
        id: 'notes',
        type: 'text',
        x: 50,
        y: 580,
        width: 1023,
        height: 100,
        content: 'Note operative e caratteristiche aggiuntive...',
        style: { fontSize: 14, fontWeight: 'normal', color: '#6b7280', whiteSpace: 'pre-line' }
      }
    ]
  },
  {
    id: 'naval-card-powerpoint',
    name: 'Template PowerPoint',
    description: 'Formato ottimizzato per presentazioni PowerPoint (16:9)',
    isDefault: true,
    canvasWidth: CANVAS_SIZES.PRESENTATION.width,
    canvasHeight: CANVAS_SIZES.PRESENTATION.height,
    canvasBackground: '#ffffff',
    canvasBorderWidth: 2,
    canvasBorderColor: '#1e40af',
    createdAt: new Date().toISOString(),
    elements: [
      {
        id: 'logo',
        type: 'logo',
        x: 50,
        y: 30,
        width: 100,
        height: 100,
        style: { backgroundColor: '#1e40af', borderRadius: 8 }
      },
      {
        id: 'flag',
        type: 'flag',
        x: 1130,
        y: 30,
        width: 100,
        height: 67,
        style: { backgroundColor: '#1e40af', borderRadius: 8 }
      },
      {
        id: 'unit_name',
        type: 'unit_name',
        x: 170,
        y: 30,
        width: 500,
        height: 40,
        content: '[NOME UNITÀ]',
        isFixed: true,
        style: { fontSize: 28, fontWeight: 'bold', color: '#1e40af' }
      },
      {
        id: 'unit_class',
        type: 'unit_class',
        x: 170,
        y: 80,
        width: 500,
        height: 30,
        content: '[CLASSE]',
        isFixed: true,
        style: { fontSize: 20, fontWeight: 'normal', color: '#374151' }
      },
      {
        id: 'silhouette',
        type: 'silhouette',
        x: 50,
        y: 150,
        width: 1180,
        height: 300,
        style: { backgroundColor: '#3b82f6', borderRadius: 8 }
      },
      {
        id: 'characteristics-table',
        type: 'table',
        x: 50,
        y: 480,
        width: 1180,
        height: 200,
        tableData: [
          ['CARATTERISTICA', 'VALORE', 'CARATTERISTICA', 'VALORE'],
          ['LUNGHEZZA', 'XXX m', 'LARGHEZZA', 'XXX m'],
          ['DISLOCAMENTO', 'XXX t', 'VELOCITÀ', 'XXX kn'],
          ['EQUIPAGGIO', 'XXX', 'ARMA', 'XXX']
        ],
        style: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }
      }
    ]
  }
];

export default function TemplateManager({ 
  onSelectTemplate, 
  onClose, 
  onTemplatesUpdate,
  currentElements,
  currentCanvasWidth,
  currentCanvasHeight,
  currentCanvasBackground,
  currentCanvasBorderWidth,
  currentCanvasBorderColor
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [customCanvasWidth, setCustomCanvasWidth] = useState(currentCanvasWidth || CANVAS_SIZES.A4_LANDSCAPE.width);
  const [customCanvasHeight, setCustomCanvasHeight] = useState(currentCanvasHeight || CANVAS_SIZES.A4_LANDSCAPE.height);
  const [customCanvasBackground, setCustomCanvasBackground] = useState(currentCanvasBackground || '#ffffff');
  const [customCanvasBorderWidth, setCustomCanvasBorderWidth] = useState(currentCanvasBorderWidth || 2);
  const [customCanvasBorderColor, setCustomCanvasBorderColor] = useState(currentCanvasBorderColor || '#000000');
  const [selectedCanvasSize, setSelectedCanvasSize] = useState('A4_LANDSCAPE');

  // Carica i template all'avvio
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const apiTemplates = await templatesApi.getAll();
      const allTemplates = [...DEFAULT_TEMPLATES, ...apiTemplates];
      setTemplates(allTemplates);
    } catch (error) {
      console.error('❌ Errore caricamento template:', error);
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasSizeChange = (sizeKey: string) => {
    setSelectedCanvasSize(sizeKey);
    if (sizeKey !== 'CUSTOM') {
      const size = CANVAS_SIZES[sizeKey as keyof typeof CANVAS_SIZES];
      setCustomCanvasWidth(size.width);
      setCustomCanvasHeight(size.height);
    }
  };

  const saveCurrentAsTemplate = async () => {
    if (!templateName.trim()) return;

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: currentElements,
      canvasWidth: customCanvasWidth,
      canvasHeight: customCanvasHeight,
      canvasBackground: customCanvasBackground,
      canvasBorderWidth: customCanvasBorderWidth,
      canvasBorderColor: customCanvasBorderColor,
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    try {
      await templatesApi.create(newTemplate);
      await loadTemplates(); // Ricarica i template
      
      // Notify parent component about template update
      if (onTemplatesUpdate) {
        onTemplatesUpdate();
      }
      
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('❌ Errore salvataggio template:', error);
      alert('Errore nel salvare il template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (templates.find(t => t.id === templateId)?.isDefault) return;
    
    if (!confirm('Sei sicuro di voler eliminare questo template?')) {
      return;
    }
    
    try {
      await templatesApi.delete(templateId);
      await loadTemplates(); // Ricarica i template
      
      // Notify parent component about template update
      if (onTemplatesUpdate) {
        onTemplatesUpdate();
      }
    } catch (error) {
      console.error('❌ Errore eliminazione template:', error);
      alert('Errore nell\'eliminare il template');
    }
  };

  const duplicateTemplate = async (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    try {
      await templatesApi.create(duplicated);
      await loadTemplates(); // Ricarica i template
      
      // Notify parent component about template update
      if (onTemplatesUpdate) {
        onTemplatesUpdate();
      }
    } catch (error) {
      console.error('❌ Errore duplicazione template:', error);
      alert('Errore nel duplicare il template');
    }
  };

  const exportTemplate = (template: Template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestione Template</h2>
            <p className="text-gray-600 mt-1">Scegli un template o salva il layout corrente</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Salva Corrente
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Caricamento template...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 relative">
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs mt-1">Preview Layout</div>
                      </div>
                    </div>
                  )}
                  {template.isDefault && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Default
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onSelectTemplate(template, false)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        title="Applica template (sostituisce tutto)"
                      >
                        Applica
                      </button>
                      <button
                        onClick={() => onSelectTemplate(template, true)}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                        title="Applica formato mantenendo contenuti"
                      >
                        Formato
                      </button>
                      
                      <button
                        onClick={() => duplicateTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Duplica"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => exportTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Esporta"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      {!template.isDefault && (
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Save Template Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Salva Template Corrente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Il mio template personalizzato"
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
                
                {/* Canvas Size Controls */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Dimensioni Canvas</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato Predefinito</label>
                    <select
                      value={selectedCanvasSize}
                      onChange={(e) => handleCanvasSizeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    >
                      {Object.entries(CANVAS_SIZES).map(([key, size]) => (
                        <option key={key} value={key}>
                          {size.name} ({size.width} x {size.height})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Larghezza (px)</label>
                      <input
                        type="number"
                        min="400"
                        max="3000"
                        value={customCanvasWidth}
                        onChange={(e) => {
                          setCustomCanvasWidth(parseInt(e.target.value) || 800);
                          setSelectedCanvasSize('CUSTOM');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Altezza (px)</label>
                      <input
                        type="number"
                        min="300"
                        max="3000"
                        value={customCanvasHeight}
                        onChange={(e) => {
                          setCustomCanvasHeight(parseInt(e.target.value) || 600);
                          setSelectedCanvasSize('CUSTOM');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Canvas Style Controls */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Stile Canvas</h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Colore Sfondo</label>
                      <input
                        type="color"
                        value={customCanvasBackground}
                        onChange={(e) => setCustomCanvasBackground(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Colore Bordo</label>
                      <input
                        type="color"
                        value={customCanvasBorderColor}
                        onChange={(e) => setCustomCanvasBorderColor(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spessore Bordo (px)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={customCanvasBorderWidth}
                      onChange={(e) => setCustomCanvasBorderWidth(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={saveCurrentAsTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Salva Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}