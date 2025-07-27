import React, { useState } from 'react';
import { Save, Download, Trash2, Copy } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  elements: any[];
  createdAt: string;
  isDefault?: boolean;
}

interface TemplateManagerProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  currentElements: any[];
}

// Template predefiniti
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'naval-card-standard',
    name: 'Scheda Navale Standard',
    description: 'Layout classico con logo, bandiera, silhouette e tabella caratteristiche',
    isDefault: true,
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
  }
];

export default function TemplateManager({ onSelectTemplate, onClose, currentElements }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('naval-templates');
    const userTemplates = saved ? JSON.parse(saved) : [];
    return [...DEFAULT_TEMPLATES, ...userTemplates];
  });
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const saveCurrentAsTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: currentElements,
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    const userTemplates = templates.filter(t => !t.isDefault);
    userTemplates.push(newTemplate);
    
    localStorage.setItem('naval-templates', JSON.stringify(userTemplates));
    setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
    
    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const deleteTemplate = (templateId: string) => {
    if (templates.find(t => t.id === templateId)?.isDefault) return;
    
    const userTemplates = templates.filter(t => !t.isDefault && t.id !== templateId);
    localStorage.setItem('naval-templates', JSON.stringify(userTemplates));
    setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
  };

  const duplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    const userTemplates = templates.filter(t => !t.isDefault);
    userTemplates.push(duplicated);
    
    localStorage.setItem('naval-templates', JSON.stringify(userTemplates));
    setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
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
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
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
                        onClick={() => onSelectTemplate(template)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      >
                        Usa
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
        </div>

        {/* Save Template Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
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