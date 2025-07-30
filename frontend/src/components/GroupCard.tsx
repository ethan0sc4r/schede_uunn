import { Play, Edit3, Trash2, Users, Layers, Download } from 'lucide-react';
import type { Group } from '../types/index.ts';
import { getImageUrl } from '../utils/imageUtils';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onPresentation?: () => void;
  onExportPowerPoint?: () => void;
}

export default function GroupCard({ group, onEdit, onDelete, onPresentation, onExportPowerPoint }: GroupCardProps) {
  return (
    <div className="card hover:shadow-xl transition-shadow duration-200">
      <div className="relative">
        {group.logo_path && (
          <div className="h-32 bg-gray-100 flex items-center justify-center">
            <img
              src={getImageUrl(group.logo_path)}
              alt={`${group.name} logo`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
        {!group.logo_path && (
          <div className="h-32 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {group.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {group.name}
        </h3>
        
        {group.description && (
          <p className="text-sm text-gray-600 mb-3">
            {group.description}
          </p>
        )}
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {group.naval_units ? group.naval_units.length : 0} unità
              </span>
            </div>
            {group.parent_group_id && (
              <div className="flex items-center space-x-1">
                <Layers className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">Sottogruppo</span>
              </div>
            )}
          </div>
          
          {group.naval_units && group.naval_units.length > 0 && (
            <div className="space-y-1">
              {group.naval_units.slice(0, 3).map((unit, index) => (
                <div key={`${unit.id}-${index}`} className="text-xs text-gray-600">
                  • {unit.name} ({unit.unit_class})
                </div>
              ))}
              {group.naval_units.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{group.naval_units.length - 3} altre unità
                </div>
              )}
            </div>
          )}

          {/* Template indicators */}
          {(group.override_logo || group.override_flag) && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                Template attivo
              </div>
              {group.presentation_config && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  {group.presentation_config.mode === 'single' ? 'Modalità singola' : 'Modalità griglia'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {onPresentation && group.naval_units && group.naval_units.length > 0 && (
            <button
              onClick={onPresentation}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
              title="Avvia Presentazione"
            >
              <Play className="h-4 w-4 mr-1" />
              Presenta
            </button>
          )}
          {onExportPowerPoint && group.naval_units && group.naval_units.length > 0 && (
            <button
              onClick={onExportPowerPoint}
              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
              title="Esporta PowerPoint"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            title="Modifica"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            title="Elimina"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}