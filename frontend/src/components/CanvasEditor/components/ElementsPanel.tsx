/**
 * ElementsPanel Component
 * Left sidebar panel for adding new elements to the canvas
 */

import { memo, useRef } from 'react';
import { Type, Image as ImageIcon, Table, Flag, Upload } from 'lucide-react';
import type { CanvasElement } from '../utils/canvasTypes';

interface ElementsPanelProps {
  // Element addition
  onAddElement: (type: CanvasElement['type'], x?: number, y?: number) => void;

  // Image uploads
  onUploadLogo: (file: File) => Promise<void>;
  onUploadFlag: (file: File) => Promise<void>;
  onUploadSilhouette: (file: File) => Promise<void>;
  onUploadGeneral: (file: File) => Promise<void>;

  // Flag selection
  onSelectPredefinedFlag: () => void;

  // Template import
  onImportTemplate: (templateData: any) => void;

  // State
  isUploading?: boolean;
}

function ElementsPanel({
  onAddElement,
  onUploadLogo,
  onUploadFlag,
  onUploadSilhouette,
  onUploadGeneral,
  onSelectPredefinedFlag,
  onImportTemplate,
  isUploading = false,
}: ElementsPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);
  const silhouetteInputRef = useRef<HTMLInputElement>(null);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadFn: (file: File) => Promise<void>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFn(file);
      event.target.value = ''; // Reset input
    }
  };

  const handleTemplateImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const template = JSON.parse(e.target?.result as string);
          onImportTemplate(template);
        } catch (error) {
          console.error('Error parsing template:', error);
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Aggiungi Elementi
      </h3>

      <div className="space-y-3">
        {/* Text Element */}
        <button
          onClick={() => onAddElement('text')}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Type className="h-4 w-4" />
          Testo
        </button>

        {/* Logo Element */}
        <div className="space-y-2">
          <button
            onClick={() => onAddElement('logo')}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Logo
          </button>
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            {isUploading ? 'Caricamento...' : 'Carica Logo'}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onUploadLogo)}
            className="hidden"
          />
        </div>

        {/* Flag Element */}
        <div className="space-y-2">
          <button
            onClick={() => onAddElement('flag')}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Bandiera
          </button>
          <button
            onClick={onSelectPredefinedFlag}
            className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
          >
            Scegli Bandiera
          </button>
          <button
            onClick={() => flagInputRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            {isUploading ? 'Caricamento...' : 'Carica Bandiera'}
          </button>
          <input
            ref={flagInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onUploadFlag)}
            className="hidden"
          />
        </div>

        {/* Silhouette Element */}
        <div className="space-y-2">
          <button
            onClick={() => onAddElement('silhouette')}
            className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Silhouette
          </button>
          <button
            onClick={() => silhouetteInputRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            {isUploading ? 'Caricamento...' : 'Carica Silhouette'}
          </button>
          <input
            ref={silhouetteInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onUploadSilhouette)}
            className="hidden"
          />
        </div>

        {/* Table Element */}
        <button
          onClick={() => onAddElement('table')}
          className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Table className="h-4 w-4" />
          Tabella
        </button>

        {/* General Image Upload */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Immagine Generica</h4>
          <button
            onClick={() => generalInputRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" />
            {isUploading ? 'Caricamento...' : 'Carica Immagine'}
          </button>
          <input
            ref={generalInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onUploadGeneral)}
            className="hidden"
          />
        </div>

        {/* Template Import */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Importa Template</h4>
          <button
            onClick={() => templateInputRef.current?.click()}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
          >
            Scegli File JSON
          </button>
          <input
            ref={templateInputRef}
            type="file"
            accept=".json"
            onChange={handleTemplateImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Suggerimento:</strong> Clicca su un elemento per aggiungerlo al canvas.
          Trascina per posizionarlo e ridimensionalo usando i controlli.
        </p>
      </div>
    </div>
  );
}

export default memo(ElementsPanel);
