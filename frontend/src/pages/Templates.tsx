import React, { useState, useEffect } from 'react';
import { Palette, Download, Upload, Copy, Trash2, Plus, Edit, Save } from 'lucide-react';
import TemplateManager, { type Template, CANVAS_SIZES } from '../components/TemplateManager';
import TemplateEditor from '../components/TemplateEditor';

// Template predefiniti - duplicati da TemplateManager per evitare dipendenze circolari
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
    elements: []
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
    elements: []
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
    elements: []
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
    elements: []
  }
];

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(undefined);

  // Carica templates all'avvio
  useEffect(() => {
    const saved = localStorage.getItem('naval-templates');
    const userTemplates = saved ? JSON.parse(saved) : [];
    setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Gestisci i tuoi template per le schede navali</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingTemplateId(undefined);
                setShowTemplateEditor(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuovo Template
            </button>
            <button
              onClick={() => setShowTemplateManager(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm flex items-center"
            >
              <Palette className="h-5 w-5 mr-2" />
              Gestisci Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 relative">
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Palette className="h-12 w-12 mx-auto mb-2" />
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs mt-1">
                          {template.canvasWidth} × {template.canvasHeight}
                        </div>
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
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingTemplateId(template.id);
                        setShowTemplateEditor(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                      title="Modifica template"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifica
                    </button>
                    
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(template, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                      title="Esporta template"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {
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
                      }}
                      className="px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                      title="Duplica template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    
                    {!template.isDefault && (
                      <button
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questo template?')) {
                            const userTemplates = templates.filter(t => !t.isDefault && t.id !== template.id);
                            localStorage.setItem('naval-templates', JSON.stringify(userTemplates));
                            setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        title="Elimina template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-16">
              <Palette className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nessun template disponibile
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Crea il tuo primo template per iniziare a organizzare i layout delle schede navali.
              </p>
              <button
                onClick={() => {
                  setEditingTemplateId(undefined);
                  setShowTemplateEditor(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crea Primo Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          onSelectTemplate={(template: Template) => {
            // Handle template selection if needed
            setShowTemplateManager(false);
          }}
          onClose={() => setShowTemplateManager(false)}
          currentElements={[]} // Empty since we're not in editor mode
        />
      )}

      {/* Template Editor */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-white z-50">
          <TemplateEditor
            templateId={editingTemplateId}
            onSave={(templateData) => {
              // Save template to localStorage
              const saved = localStorage.getItem('naval-templates');
              const userTemplates = saved ? JSON.parse(saved) : [];
              
              const existingIndex = userTemplates.findIndex((t: Template) => t.id === templateData.id);
              if (existingIndex >= 0) {
                userTemplates[existingIndex] = templateData;
              } else {
                userTemplates.push(templateData);
              }
              
              localStorage.setItem('naval-templates', JSON.stringify(userTemplates));
              setShowTemplateEditor(false);
              setEditingTemplateId(undefined);
            }}
            onCancel={() => {
              setShowTemplateEditor(false);
              setEditingTemplateId(undefined);
            }}
          />
        </div>
      )}
    </div>
  );
}