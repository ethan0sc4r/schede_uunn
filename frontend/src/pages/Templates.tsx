import React, { useState } from 'react';
import { Palette, Download, Upload, Copy, Trash2, Plus, Edit } from 'lucide-react';
import TemplateManager, { type Template } from '../components/TemplateManager';
import TemplateEditor from '../components/TemplateEditor';

export default function Templates() {
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(undefined);

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
          <div className="text-center py-16">
            <Palette className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Gestione Template
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crea, modifica e organizza i tuoi template personalizzati per le schede navali. 
              Utilizza i template per mantenere coerenza nel design delle tue schede.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => {
                  setEditingTemplateId(undefined);
                  setShowTemplateEditor(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crea Nuovo Template
              </button>
              <button
                onClick={() => setShowTemplateManager(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <Palette className="h-5 w-5 mr-2" />
                Apri Gestione Template
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Crea Template</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Salva il layout attuale come nuovo template riutilizzabile
              </p>
              <button 
                onClick={() => {
                  setEditingTemplateId(undefined);
                  setShowTemplateEditor(true);
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Crea nuovo template →
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Importa Template</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Carica template da file JSON esterni
              </p>
              <button 
                onClick={() => setShowTemplateManager(true)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Importa template →
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Copy className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Template Predefiniti</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Utilizza i template standard già disponibili
              </p>
              <button 
                onClick={() => setShowTemplateManager(true)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Visualizza template →
              </button>
            </div>
          </div>
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