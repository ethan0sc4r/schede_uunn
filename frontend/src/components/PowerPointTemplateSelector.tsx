import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { CANVAS_SIZES } from './TemplateManager';

interface PowerPointTemplate {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  recommended?: boolean;
}

interface PowerPointTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (templateConfig: any) => void;
  unitName: string;
}

const POWERPOINT_TEMPLATES: PowerPointTemplate[] = [
  {
    id: 'presentation',
    name: 'Presentazione Standard',
    description: 'Formato 16:9 ottimizzato per presentazioni',
    canvasWidth: CANVAS_SIZES.PRESENTATION.width,
    canvasHeight: CANVAS_SIZES.PRESENTATION.height,
    aspectRatio: '16:9',
    recommended: true
  },
  {
    id: 'a4-landscape',
    name: 'A4 Orizzontale',
    description: 'Formato A4 per stampa e documenti',
    canvasWidth: CANVAS_SIZES.A4_LANDSCAPE.width,
    canvasHeight: CANVAS_SIZES.A4_LANDSCAPE.height,
    aspectRatio: '4:3'
  },
  {
    id: 'a4-portrait',
    name: 'A4 Verticale',
    description: 'Formato A4 verticale per report dettagliati',
    canvasWidth: CANVAS_SIZES.A4_PORTRAIT.width,
    canvasHeight: CANVAS_SIZES.A4_PORTRAIT.height,
    aspectRatio: '3:4'
  },
  {
    id: 'a3-landscape',
    name: 'A3 Orizzontale',
    description: 'Formato A3 per schede dettagliate',
    canvasWidth: CANVAS_SIZES.A3_LANDSCAPE.width,
    canvasHeight: CANVAS_SIZES.A3_LANDSCAPE.height,
    aspectRatio: '√2:1'
  }
];

export default function PowerPointTemplateSelector({ 
  isOpen, 
  onClose, 
  onExport, 
  unitName 
}: PowerPointTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PowerPointTemplate>(POWERPOINT_TEMPLATES[0]);

  const handleExport = () => {
    const templateConfig = {
      canvasWidth: selectedTemplate.canvasWidth,
      canvasHeight: selectedTemplate.canvasHeight,
      templateName: selectedTemplate.name,
      templateId: selectedTemplate.id
    };
    
    onExport(templateConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Esporta PowerPoint</h2>
            <p className="text-gray-600 mt-1">Seleziona il formato per "{unitName}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Formato Presentazione</h3>
              <p className="text-sm text-gray-600">
                Scegli il formato più adatto al tuo utilizzo. Il formato verrà applicato mantenendo tutti i contenuti della scheda.
              </p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {POWERPOINT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        {template.recommended && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            ⭐ Consigliato
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="font-medium">Rapporto: {template.aspectRatio}</span>
                        <span className="mx-2">•</span>
                        <span>{template.canvasWidth} × {template.canvasHeight} px</span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <div className={`w-20 h-12 border-2 rounded shadow-sm ${
                        selectedTemplate.id === template.id ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        <div 
                          className={`w-full h-full rounded ${
                            selectedTemplate.id === template.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                          style={{
                            aspectRatio: `${template.canvasWidth} / ${template.canvasHeight}`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedTemplate.id === template.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Informazioni sull'esportazione</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Il PowerPoint verrà generato con tutti gli elementi della scheda (testi, immagini, tabelle) 
                    adattati al formato selezionato. Bordi e stili saranno preservati.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            Formato selezionato: <span className="font-medium text-gray-900">{selectedTemplate.name}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Conferma ed Esporta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}