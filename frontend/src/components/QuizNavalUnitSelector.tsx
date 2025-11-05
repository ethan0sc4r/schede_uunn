import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';
import { navalUnitsApi } from '../services/api';
import type { NavalUnit } from '../types/index.ts';

interface QuizNavalUnitSelectorProps {
  selectedUnitIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onNext: () => void;
}

export default function QuizNavalUnitSelector({
  selectedUnitIds,
  onSelectionChange,
  onNext
}: QuizNavalUnitSelectorProps) {
  const [units, setUnits] = useState<NavalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await navalUnitsApi.getAll();
      setUnits(data);
    } catch (error) {
      console.error('Error loading naval units:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.unit_class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUnit = (unitId: number) => {
    if (selectedUnitIds.includes(unitId)) {
      onSelectionChange(selectedUnitIds.filter(id => id !== unitId));
    } else {
      onSelectionChange([...selectedUnitIds, unitId]);
    }
  };

  const toggleAll = () => {
    if (selectedUnitIds.length === filteredUnits.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all filtered
      onSelectionChange(filteredUnits.map(u => u.id));
    }
  };

  const isAllSelected = filteredUnits.length > 0 && selectedUnitIds.length === filteredUnits.length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Ships for Quiz</h3>
        <p className="text-sm text-gray-600">
          Choose which naval units to use for generating quiz questions
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Select All Toggle */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {isAllSelected ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
          {isAllSelected ? 'Deselect all' : 'Select all'}
        </button>
        <span className="text-sm text-gray-600">
          {selectedUnitIds.length} / {filteredUnits.length} selected
        </span>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading naval units...</span>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No naval units found</p>
          {searchTerm && (
            <p className="text-sm mt-1">Try modifying your search term</p>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {filteredUnits.map((unit) => {
            const isSelected = selectedUnitIds.includes(unit.id);
            return (
              <button
                key={unit.id}
                onClick={() => toggleUnit(unit.id)}
                className={`w-full flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{unit.name}</div>
                  <div className="text-sm text-gray-600">{unit.unit_class}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selection Summary & Next Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedUnitIds.length === 0 ? (
            <span className="text-red-600 font-medium">⚠️ Select at least one ship to continue</span>
          ) : (
            <span className="text-green-600 font-medium">✓ {selectedUnitIds.length} ships selected</span>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={selectedUnitIds.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
