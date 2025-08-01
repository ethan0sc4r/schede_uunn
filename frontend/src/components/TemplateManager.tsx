import { useState, useEffect } from 'react';
import { Save, Download, Trash2, Copy, Edit } from 'lucide-react';
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

// Template predefiniti - Solo PowerPoint editabile
export const DEFAULT_TEMPLATES: Template[] = [
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
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [customCanvasWidth, setCustomCanvasWidth] = useState(currentCanvasWidth || CANVAS_SIZES.A4_LANDSCAPE.width);
  const [customCanvasHeight, setCustomCanvasHeight] = useState(currentCanvasHeight || CANVAS_SIZES.A4_LANDSCAPE.height);
  const [customCanvasBackground, setCustomCanvasBackground] = useState(currentCanvasBackground || '#ffffff');
  const [customCanvasBorderWidth, setCustomCanvasBorderWidth] = useState(currentCanvasBorderWidth || 2);
  const [customCanvasBorderColor, setCustomCanvasBorderColor] = useState(currentCanvasBorderColor || '#000000');
  const [selectedCanvasSize, setSelectedCanvasSize] = useState('A4_LANDSCAPE');

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

    const templateData: Template = {
      id: editingTemplateId || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: currentElements,
      canvasWidth: customCanvasWidth,
      canvasHeight: customCanvasHeight,
      canvasBackground: customCanvasBackground,
      canvasBorderWidth: customCanvasBorderWidth,
      canvasBorderColor: customCanvasBorderColor,
      createdAt: editingTemplateId ? templates.find(t => t.id === editingTemplateId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      isDefault: editingTemplateId ? templates.find(t => t.id === editingTemplateId)?.isDefault || false : false
    };

    try {
      if (editingTemplateId) {
        // Aggiorna template esistente
        await templatesApi.update(editingTemplateId, templateData);
      } else {
        // Crea nuovo template
        await templatesApi.create(templateData);
      }
      
      await loadTemplates(); // Ricarica i template
      
      // Notify parent component about template update
      if (onTemplatesUpdate) {
        onTemplatesUpdate();
      }
      
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      setEditingTemplateId(null);
    } catch (error) {
      console.error('❌ Errore salvataggio template:', error);
      alert('Errore nel salvare il template');
    }
  };

  // Helper function to check if a template can be edited
  const canEditTemplate = (templateId: string) => {
    // Tutti i template possono essere editati ora, incluso PowerPoint
    return true;
  };

  // Helper function to check if a template can be deleted
  const canDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template && !template.isDefault;
  };

  const deleteTemplate = async (templateId: string) => {
    if (!canDeleteTemplate(templateId)) return;
    
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

  const editTemplate = (template: Template) => {
    // Carica il template per l'editing
    onSelectTemplate(template, false);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setEditingTemplateId(template.id);
    setShowSaveDialog(true);
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

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Gestione Template</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salva Corrente
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nessun template disponibile</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <div className="bg-white rounded-lg p-3 mb-4 min-h-32 flex items-center justify-center border">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Anteprima</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.canvasWidth} x {template.canvasHeight}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                      {template.isDefault && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => onSelectTemplate(template, false)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      title="Applica template sostituendo tutto"
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
                    
                    {canEditTemplate(template.id) && (
                      <button
                        onClick={() => editTemplate(template)}
                        className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Modifica"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => exportTemplate(template)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Esporta"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    {canDeleteTemplate(template.id) && (
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
            ))}
            </div>
          )}
        </div>

        {/* Save Template Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplateId ? 'Modifica Template' : 'Salva Template Corrente'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Template</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Inserisci nome template..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrizione del template..."
                  />
                </div>
                
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
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Altezza (px)</label>
                      <input
                        type="number"
                        min="400"
                        max="3000"
                        value={customCanvasHeight}
                        onChange={(e) => {
                          setCustomCanvasHeight(parseInt(e.target.value) || 600);
                          setSelectedCanvasSize('CUSTOM');
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Colore Sfondo</label>
                      <input
                        type="color"
                        value={customCanvasBackground}
                        onChange={(e) => setCustomCanvasBackground(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spessore Bordo (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={customCanvasBorderWidth}
                        onChange={(e) => setCustomCanvasBorderWidth(parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colore Bordo</label>
                    <input
                      type="color"
                      value={customCanvasBorderColor}
                      onChange={(e) => setCustomCanvasBorderColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName('');
                    setTemplateDescription('');
                    setEditingTemplateId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={saveCurrentAsTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {editingTemplateId ? 'Aggiorna Template' : 'Salva Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}