import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CANVAS_PRESETS = {
  A4_LANDSCAPE: { width: 1123, height: 794, name: 'A4 Orizzontale' },
  A4_PORTRAIT: { width: 794, height: 1123, name: 'A4 Verticale' },
  A3_LANDSCAPE: { width: 1587, height: 1123, name: 'A3 Orizzontale' },
  A3_PORTRAIT: { width: 1123, height: 1587, name: 'A3 Verticale' },
  PRESENTATION: { width: 1280, height: 720, name: 'Presentazione (16:9)' },
  CUSTOM: { width: 1200, height: 800, name: 'Personalizzato' }
};

interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  initialSettings: {
    canvasWidth: number;
    canvasHeight: number;
    canvasBackground: string;
    canvasBorderWidth: number;
    canvasBorderColor: string;
    selectedPreset: string;
  };
}

export default function LayoutSettingsModal({ isOpen, onClose, onSave, initialSettings }: LayoutSettingsModalProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [selectedPreset, setSelectedPreset] = useState(initialSettings.selectedPreset);

  useEffect(() => {
    setSettings(initialSettings);
    setSelectedPreset(initialSettings.selectedPreset);
  }, [initialSettings]);

  const handleSave = () => {
    onSave({ ...settings, selectedPreset });
    onClose();
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'CUSTOM') {
      const preset = CANVAS_PRESETS[presetKey as keyof typeof CANVAS_PRESETS];
      setSettings(prev => ({ ...prev, canvasWidth: preset.width, canvasHeight: preset.height }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Impostazioni Layout</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Dimensioni Canvas</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                >
                  {Object.entries(CANVAS_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.name} ({preset.width} × {preset.height})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Larghezza (px)</label>
                  <input
                    type="number"
                    min="400"
                    max="3000"
                    value={settings.canvasWidth}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, canvasWidth: parseInt(e.target.value) || 400 }));
                      setSelectedPreset('CUSTOM');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Altezza (px)</label>
                  <input
                    type="number"
                    min="300"
                    max="3000"
                    value={settings.canvasHeight}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, canvasHeight: parseInt(e.target.value) || 300 }));
                      setSelectedPreset('CUSTOM');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Stile Canvas</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colore Sfondo</label>
                    <input
                      type="color"
                      value={settings.canvasBackground}
                      onChange={(e) => setSettings(prev => ({ ...prev, canvasBackground: e.target.value }))}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colore Bordo</label>
                    <input
                      type="color"
                      value={settings.canvasBorderColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, canvasBorderColor: e.target.value }))}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spessore Bordo (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.canvasBorderWidth}
                    onChange={(e) => setSettings(prev => ({ ...prev, canvasBorderWidth: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Annulla
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  );
}
