/**
 * TemplateSelector Component
 * Simplified template selector for toolbar - button that opens modal
 */

import { memo, useState } from 'react';
import { Layout } from 'lucide-react';
import type { Template } from '../../TemplateManager';

interface TemplateSelectorProps {
  currentTemplateId: string;
  onTemplateSelect: (template: Template, formatOnly: boolean) => void;
}

function TemplateSelector({ currentTemplateId, onTemplateSelect }: TemplateSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        title="Gestisci Template"
      >
        <Layout className="h-4 w-4 mr-2" />
        Template
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Seleziona Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Template ID corrente: {currentTemplateId || 'Nessuno'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              La gestione template completa verrà ripristinata a breve.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(TemplateSelector);
