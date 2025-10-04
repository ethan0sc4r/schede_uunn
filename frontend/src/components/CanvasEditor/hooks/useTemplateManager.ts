/**
 * useTemplateManager Hook
 * Manages template loading, saving, and application
 */

import { useState, useCallback, useEffect } from 'react';
import { templatesApi } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import type { CanvasElement } from '../utils/canvasTypes';
import type { Template } from '../../TemplateManager';

interface TemplateState {
  element_states: CanvasElement[];
  canvas_config: {
    canvasWidth: number;
    canvasHeight: number;
    canvasBackground: string;
    canvasBorderWidth: number;
    canvasBorderColor: number;
  };
}

interface UseTemplateManagerProps {
  unitId?: number;
  currentTemplateId?: string;
}

interface UseTemplateManagerReturn {
  templateStates: Record<string, TemplateState>;
  currentTemplateId: string;
  setCurrentTemplateId: React.Dispatch<React.SetStateAction<string>>;
  templateStatesLoaded: boolean;
  loadTemplateState: (templateId: string) => Promise<void>;
  saveTemplateState: (templateId: string, state: TemplateState) => Promise<void>;
  applyTemplate: (
    template: Template,
    elements: CanvasElement[],
    formatOnly: boolean
  ) => {
    elements: CanvasElement[];
    canvasWidth?: number;
    canvasHeight?: number;
    canvasBackground?: string;
  };
  loadAllTemplateStates: () => Promise<void>;
}

export const useTemplateManager = ({
  unitId,
  currentTemplateId: initialTemplateId = 'naval-card-powerpoint',
}: UseTemplateManagerProps): UseTemplateManagerReturn => {
  const [templateStates, setTemplateStates] = useState<Record<string, TemplateState>>({});
  const [currentTemplateId, setCurrentTemplateId] = useState(initialTemplateId);
  const [templateStatesLoaded, setTemplateStatesLoaded] = useState(false);
  const { error: showError } = useToast();

  /**
   * Load a specific template state from the server
   */
  const loadTemplateState = useCallback(
    async (templateId: string) => {
      if (!unitId) return;

      try {
        const state = await templatesApi.getTemplateState(unitId, templateId);
        if (state) {
          setTemplateStates(prev => ({
            ...prev,
            [templateId]: state,
          }));
        }
      } catch (error) {
        console.error(`Error loading template state for ${templateId}:`, error);
        // Don't show error to user - template states are optional
      }
    },
    [unitId]
  );

  /**
   * Save template state to the server
   */
  const saveTemplateState = useCallback(
    async (templateId: string, state: TemplateState) => {
      if (!unitId) return;

      try {
        await templatesApi.saveTemplateState(unitId, templateId, state);

        // Update local state
        setTemplateStates(prev => ({
          ...prev,
          [templateId]: state,
        }));
      } catch (error) {
        console.error(`Error saving template state for ${templateId}:`, error);
        showError('Errore durante il salvataggio dello stato del template');
      }
    },
    [unitId, showError]
  );

  /**
   * Load all template states for the current unit
   */
  const loadAllTemplateStates = useCallback(async () => {
    if (!unitId) {
      setTemplateStatesLoaded(true);
      return;
    }

    try {
      const states = await templatesApi.getAllTemplateStates(unitId);
      setTemplateStates(states || {});
    } catch (error) {
      console.error('Error loading all template states:', error);
      // Don't show error - template states are optional
    } finally {
      setTemplateStatesLoaded(true);
    }
  }, [unitId]);

  /**
   * Apply a template to the canvas
   * @param template - The template to apply
   * @param elements - Current canvas elements
   * @param formatOnly - If true, only apply formatting without changing content
   */
  const applyTemplate = useCallback(
    (
      template: Template,
      elements: CanvasElement[],
      formatOnly: boolean = false
    ): {
      elements: CanvasElement[];
      canvasWidth?: number;
      canvasHeight?: number;
      canvasBackground?: string;
    } => {
      const templateElements = template.elements || [];

      if (formatOnly) {
        // Format-only mode: preserve content, update positions and styles
        const updatedElements = elements.map(element => {
          const templateElement = templateElements.find(te => te.type === element.type);
          if (!templateElement) return element;

          return {
            ...element,
            x: templateElement.x,
            y: templateElement.y,
            width: templateElement.width,
            height: templateElement.height,
            style: {
              ...element.style,
              ...templateElement.style,
            },
          };
        });

        // Add any template elements that don't exist in current elements
        const existingTypes = new Set(elements.map(el => el.type));
        const newElements = templateElements
          .filter(te => !existingTypes.has(te.type))
          .map(te => ({ ...te }));

        return {
          elements: [...updatedElements, ...newElements],
          canvasWidth: template.canvasWidth,
          canvasHeight: template.canvasHeight,
          canvasBackground: template.canvasBackground,
        };
      } else {
        // Full replace mode: use template elements as-is
        return {
          elements: templateElements.map(el => ({ ...el })),
          canvasWidth: template.canvasWidth,
          canvasHeight: template.canvasHeight,
          canvasBackground: template.canvasBackground,
        };
      }
    },
    []
  );

  // Load all template states on mount
  useEffect(() => {
    loadAllTemplateStates();
  }, [loadAllTemplateStates]);

  return {
    templateStates,
    currentTemplateId,
    setCurrentTemplateId,
    templateStatesLoaded,
    loadTemplateState,
    saveTemplateState,
    applyTemplate,
    loadAllTemplateStates,
  };
};
