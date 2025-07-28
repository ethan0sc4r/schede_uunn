import { useState } from 'react';
import { Download, Share2, FileImage, Printer, ExternalLink, Edit3, Trash2, Eye, FileText } from 'lucide-react';
import type { NavalUnit } from '../types/index.ts';
import { navalUnitsApi } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import PowerPointTemplateSelector from './PowerPointTemplateSelector';

interface NavalUnitCardProps {
  unit: NavalUnit;
  onEdit: () => void;
  onDelete: () => void;
  onEditNotes?: () => void;
}

export default function NavalUnitCard({ unit, onEdit, onDelete, onEditNotes }: NavalUnitCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showPowerPointSelector, setShowPowerPointSelector] = useState(false);

  const handlePrint = async () => {
    try {
      // Open unit view in new window 
      const viewWindow = window.open(`/units/${unit.id}/view`, '_blank');
      if (viewWindow) {
        alert('Per stampare: apri la pagina di visualizzazione e usa il pulsante Stampa');
      }
    } catch (error) {
      console.error('Errore stampa:', error);
      alert('Errore durante l\'apertura pagina di stampa');
    }
  };

  const handleExportPNG = async () => {
    try {
      // Open unit view in new window and capture it
      const viewWindow = window.open(`/units/${unit.id}/view`, '_blank');
      if (viewWindow) {
        alert('Per esportare PNG: apri la pagina di visualizzazione e usa il pulsante PNG');
      }
    } catch (error) {
      console.error('Errore esportazione PNG:', error);
      alert('Errore durante l\'esportazione PNG');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/units/${unit.id}/view`;
    const shareMessage = `Nave ${unit.name} classe ${unit.unit_class} è stato copiato in memoria`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(shareMessage);
    } catch (error) {
      console.error('Errore copia link:', error);
      alert('Errore durante la copia del link');
    }
  };

  const handlePowerPointExport = async (templateConfig: any) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      const response = await fetch(`${API_BASE_URL}/api/units/${unit.id}/export/powerpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateConfig)
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'export PowerPoint');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${unit.name}_${unit.unit_class}.pptx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      alert(`PowerPoint di "${unit.name}" esportato con successo!`);
    } catch (error) {
      console.error('Errore export PowerPoint:', error);
      alert('Errore durante l\'export PowerPoint');
    }
  };

  return (
    <div className="card hover:shadow-xl transition-shadow duration-200 relative" 
         onMouseEnter={() => setShowActions(true)}
         onMouseLeave={() => setShowActions(false)}>
      <div className="relative">
        {(() => {
          // Use silhouette_path from database first, then check layout_config as fallback
          if (unit.silhouette_path) {
            return (
              <div className="h-32 bg-white flex items-center justify-center border-b border-gray-200">
                <img
                  src={getImageUrl(unit.silhouette_path)}
                  alt={`${unit.name} silhouette`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            );
          } else {
            // Find silhouette element in layout_config as fallback
            const silhouetteElement = unit.layout_config?.elements?.find((el: any) => el.type === 'silhouette');
            const silhouetteImage = silhouetteElement?.image;
            
            if (silhouetteImage) {
              return (
                <div className="h-32 bg-white flex items-center justify-center border-b border-gray-200">
                  <img
                    src={getImageUrl(silhouetteImage)}
                    alt={`${unit.name} silhouette`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              );
            }
          }
          
          // No image found
          return (
            <div className="h-32 bg-white flex items-center justify-center border-b border-gray-200">
              <div className="text-center text-gray-400">
                <svg className="h-16 w-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v1c0 1.11.89 2 2 2h1v9c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-9h1c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM8 20H6v-8h2v8zm6 0h-4v-6.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5V20zm4 0h-2v-8h2v8z"/>
                </svg>
                <span className="text-sm">Nessuna silhouette</span>
              </div>
            </div>
          );
        })()}
        {/* Template indicator */}
        {unit.template_name && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
            {unit.template_name}
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-2 left-2 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Condividi"
            >
              <Share2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportPNG();
              }}
              className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Esporta PNG"
            >
              <FileImage className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrint();
              }}
              className="p-1 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
              title="Stampa"
            >
              <Printer className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPowerPointSelector(true);
              }}
              className="p-1 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
              title="Esporta PowerPoint"
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {unit.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Classe: {unit.unit_class}
        </p>
        {unit.nation && (
          <p className="text-sm text-gray-600 mb-3">
            Nazione: {unit.nation}
          </p>
        )}
        
        {unit.characteristics && unit.characteristics.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Caratteristiche principali:
            </h4>
            <div className="space-y-1">
              {unit.characteristics.slice(0, 3).map((char, index) => (
                <div key={char.id} className="text-xs text-gray-600">
                  <span className="font-medium">{char.characteristic_name}:</span> {char.characteristic_value}
                </div>
              ))}
              {unit.characteristics.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{unit.characteristics.length - 3} altre caratteristiche
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.open(`/units/${unit.id}/view`, '_blank')}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            title="Visualizza"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            title="Modifica"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          {onEditNotes && (
            <button
              onClick={onEditNotes}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              title="Note"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            title="Elimina"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* PowerPoint Template Selector */}
      <PowerPointTemplateSelector
        isOpen={showPowerPointSelector}
        onClose={() => setShowPowerPointSelector(false)}
        onExport={handlePowerPointExport}
        unitName={unit.name}
      />
    </div>
  );
}