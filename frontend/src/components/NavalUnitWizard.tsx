import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Ship, FileText, Image, Palette, Plane } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { navalUnitsApi, templatesApi } from '../services/api';
import type { CreateNavalUnitRequest, UnitType } from '../types/index.ts';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_TEMPLATES } from './TemplateManager';

interface NavalUnitWizardProps {
  onClose: () => void;
  onSave: (createdUnit?: any) => void;
  sourceUnit?: any; // For duplication
}

type Step = 'basic' | 'appearance';

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

  const [unitType, setUnitType] = useState<UnitType>(
    sourceUnit?.layout_config?.unitType || 'ship'
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
    onSuccess: (createdUnit) => {
      success('Unità navale creata con successo!');
      onSave(createdUnit);
    },
  });

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: Ship },
    { id: 'appearance', label: 'Template & Appearance', icon: Palette },
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
        canvasBorderColor: selectedTemplateObj.canvasBorderColor,
        unitType: unitType // Add unit type to layout config
      };

      console.log('✅ Applying template to new unit:', selectedTemplate, layout_config);
    } else if (unitType) {
      // If no template selected, still save unitType
      layout_config = { unitType };
    }

    const requestData: CreateNavalUnitRequest = {
      ...formData,
      current_template_id: selectedTemplate,
      layout_config: layout_config,
      characteristics: [],
    };

    try {
      await createMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showError('Errore durante il salvataggio dell\'unità navale');
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim() && formData.unit_class.trim();
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
            {sourceUnit ? 'Duplicate Naval Unit' : 'Create New Naval Unit'}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
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
                    Class *
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

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnitType('ship')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      unitType === 'ship'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Ship className="h-7 w-7 mx-auto mb-2" />
                    <div className="text-xs font-medium">Ship</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitType('submarine')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      unitType === 'submarine'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="h-7 w-7 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="12" rx="9" ry="4" />
                      <path d="M3 12v3c0 1.5 4 3 9 3s9-1.5 9-3v-3" />
                      <circle cx="12" cy="9" r="1.5" />
                      <line x1="12" y1="7.5" x2="12" y2="4" />
                      <line x1="10" y1="4" x2="14" y2="4" />
                    </svg>
                    <div className="text-xs font-medium">Submarine</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitType('aircraft')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      unitType === 'aircraft'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Plane className="h-7 w-7 mx-auto mb-2" />
                    <div className="text-xs font-medium">Airplane</div>
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                The nation will be automatically detected when you upload the flag in the Images section
              </p>
            </div>
          )}

          {currentStep === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Template</h3>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Loading templates...</p>
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
                          {template.description || 'No description'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Background Color</h3>
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
                  <strong>💡 Tip:</strong> After creating the unit, you can further customize the layout
                  in the visual editor and add logo, silhouette, flag and image gallery.
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
            Cancel
          </button>

          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isStepValid() || createMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Unit'}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
