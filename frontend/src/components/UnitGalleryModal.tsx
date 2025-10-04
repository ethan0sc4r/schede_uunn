import { X } from 'lucide-react';
import GalleryManager from './GalleryManager';

interface UnitGalleryModalProps {
  unitId: number;
  unitName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UnitGalleryModal({ unitId, unitName, isOpen, onClose }: UnitGalleryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Galleria Immagini</h2>
            <p className="text-gray-600 mt-1">{unitName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Gallery Manager */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <GalleryManager unitId={unitId} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
