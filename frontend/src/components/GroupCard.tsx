import type { Group } from '../types/index.ts';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GroupCard({ group, onEdit, onDelete }: GroupCardProps) {
  return (
    <div className="card hover:shadow-xl transition-shadow duration-200">
      <div className="relative">
        {group.logo_path && (
          <div className="h-32 bg-gray-100 flex items-center justify-center">
            <img
              src={`/api/static/${group.logo_path}`}
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
          <p className="text-sm text-gray-700 font-medium mb-2">
            Unità navali: {group.naval_units ? group.naval_units.length : 0}
          </p>
          
          {group.naval_units && group.naval_units.length > 0 && (
            <div className="space-y-1">
              {group.naval_units.slice(0, 3).map((unit) => (
                <div key={unit.id} className="text-xs text-gray-600">
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
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Modifica
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}