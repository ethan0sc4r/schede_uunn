import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Ship, FileText, Image, Palette } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { navalUnitsApi, templatesApi } from '../services/api';
import type { CreateNavalUnitRequest, CreateCharacteristicRequest } from '../types/index.ts';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_TEMPLATES } from './TemplateManager';

interface NavalUnitWizardProps {
  onClose: () => void;
  onSave: () => void;
  sourceUnit?: any; // For duplication
}

type Step = 'basic' | 'characteristics' | 'appearance';

export default function NavalUnitWizard({ onClose, onSave, sourceUnit }: NavalUnitWizardProps) {
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [selectedTemplate, setSelectedTemplate] = useState(sourceUnit?.current_template_id || 'naval-card-standard');
  const [templates, setTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: sourceUnit?.name ? `${sourceUnit.name} (Copia)` : '',
    unit_class: sourceUnit?.unit_class || '',
    background_color: sourceUnit?.background_color || '#ffffff',
    silhouette_zoom: sourceUnit?.silhouette_zoom || '100',
    silhouette_position_x: sourceUnit?.silhouette_position_x || '50',
    silhouette_position_y: sourceUnit?.silhouette_position_y || '50',
  });

  const [characteristics, setCharacteristics] = useState<CreateCharacteristicRequest[]>(
    sourceUnit?.characteristics?.length > 0
      ? sourceUnit.characteristics.map((char: any) => ({
          characteristic_name: char.characteristic_name,
          characteristic_value: char.characteristic_value,
          order_index: char.order_index,
        }))
      : [{ characteristic_name: '', characteristic_value: '', order_index: 0 }]
  );

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const apiTemplates = await templatesApi.getAll();
        const allTemplates = [...DEFAULT_TEMPLATES, ...apiTemplates];
        setTemplates(allTemplates);
      } catch (error) {
        console.error('❌ Errore caricamento template:', error);
        setTemplates(DEFAULT_TEMPLATES);
      }
    };
    loadTemplates();
  }, []);

  const createMutation = useMutation({
    mutationFn: navalUnitsApi.create,
    onSuccess: () => {
      success('Unità navale creata con successo!');
      onSave();
    },
  });

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'basic', label: 'Info Base', icon: Ship },
    { id: 'characteristics', label: 'Caratteristiche', icon: FileText },
    { id: 'appearance', label: 'Template & Aspetto', icon: Palette },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    const validCharacteristics = characteristics.filter(
      char => char.characteristic_name.trim() && char.characteristic_value.trim()
    );

    // Find selected template and apply its layout
    const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
    let layout_config = null;

    if (selectedTemplateObj) {
      // Apply template layout configuration
      layout_config = {
        elements: selectedTemplateObj.elements || [],
        canvasWidth: selectedTemplateObj.canvasWidth,
        canvasHeight: selectedTemplateObj.canvasHeight,
        canvasBackground: selectedTemplateObj.canvasBackground,
        canvasBorderWidth: selectedTemplateObj.canvasBorderWidth,
        canvasBorderColor: selectedTemplateObj.canvasBorderColor
      };

      console.log('✅ Applying template to new unit:', selectedTemplate, layout_config);
    }

    const requestData: CreateNavalUnitRequest = {
      ...formData,
      current_template_id: selectedTemplate,
      layout_config: layout_config,
      characteristics: validCharacteristics.map((char, index) => ({
        ...char,
        order_index: index,
      })),
    };

    try {
      await createMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showError('Errore durante il salvataggio dell\'unità navale');
    }
  };

  const addCharacteristic = () => {
    setCharacteristics([
      ...characteristics,
      { characteristic_name: '', characteristic_value: '', order_index: characteristics.length }
    ]);
  };

  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const updateCharacteristic = (index: number, field: string, value: string) => {
    const updated = [...characteristics];
    updated[index] = { ...updated[index], [field]: value };
    setCharacteristics(updated);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim() && formData.unit_class.trim();
      case 'characteristics':
        return true; // Optional
      case 'appearance':
        return true; // Optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header with Steps */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {sourceUnit ? 'Duplica Unità Navale' : 'Crea Nuova Unità Navale'}
          </h2>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informazioni di Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Es: USS Enterprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.unit_class}
                    onChange={(e) => setFormData({ ...formData, unit_class: e.target.value })}
                    placeholder="Es: Nimitz"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                La nazione verrà rilevata automaticamente quando carichi la bandiera nella sezione Immagini
              </p>
            </div>
          )}

          {currentStep === 'characteristics' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Caratteristiche Tecniche</h3>
                <button
                  type="button"
                  onClick={addCharacteristic}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                >
                  + Aggiungi
                </button>
              </div>

              <div className="space-y-3">
                {characteristics.map((char, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Nome caratteristica (es: Lunghezza)"
                      className="input-field flex-1"
                      value={char.characteristic_name}
                      onChange={(e) => updateCharacteristic(index, 'characteristic_name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Valore (es: 333 m)"
                      className="input-field flex-1"
                      value={char.characteristic_value}
                      onChange={(e) => updateCharacteristic(index, 'characteristic_value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeCharacteristic(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {characteristics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nessuna caratteristica aggiunta</p>
                  <p className="text-sm mt-1">Clicca "+ Aggiungi" per inserire le caratteristiche tecniche</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seleziona Template</h3>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Caricamento template...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{template.name}</div>
                          {template.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.description || 'Nessuna descrizione'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Colore di Sfondo</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field flex-1"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Suggerimento:</strong> Dopo aver creato l'unità, potrai personalizzare ulteriormente il layout
                  nell'editor visuale e aggiungere logo, silhouette, bandiera e galleria di immagini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Annulla
          </button>

          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Indietro
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid() || createMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creazione...' : 'Crea Unità'}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
