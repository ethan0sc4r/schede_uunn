/**
 * useElementOperations Hook
 * Provides CRUD operations for canvas elements
 */

import { useCallback } from 'react';
import type { CanvasElement } from '../utils/canvasTypes';
import {
  createElement,
  duplicateElement,
  bringToFront,
  sendToBack,
  getDefaultContent,
} from '../utils/elementHelpers';
import { DEFAULT_TABLE_DATA } from '../utils/canvasConstants';

interface UseElementOperationsProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setSelectedElement: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseElementOperationsReturn {
  addElement: (type: CanvasElement['type'], x?: number, y?: number, overrides?: Partial<CanvasElement>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElementById: (id: string) => void;
  moveElement: (id: string, deltaX: number, deltaY: number) => void;
  resizeElement: (id: string, width: number, height: number, x?: number, y?: number) => void;
  bringElementToFront: (id: string) => void;
  sendElementToBack: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  getElementBy Id: (id: string) => CanvasElement | undefined;
}

export const useElementOperations = ({
  elements,
  setElements,
  setSelectedElement,
}: UseElementOperationsProps): UseElementOperationsReturn => {
  // Add a new element
  const addElement = useCallback(
    (
      type: CanvasElement['type'],
      x: number = 50,
      y: number = 50,
      overrides?: Partial<CanvasElement>
    ) => {
      const baseOverrides: Partial<CanvasElement> = {};

      // Add default content based on type
      if (type === 'text' || type === 'unit_name' || type === 'unit_class') {
        baseOverrides.content = getDefaultContent(type);
      }

      // Add default table data for tables
      if (type === 'table') {
        baseOverrides.tableData = DEFAULT_TABLE_DATA;
      }

      const newElement = createElement(type, x, y, { ...baseOverrides, ...overrides });

      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
    },
    [setElements, setSelectedElement]
  );

  // Update an existing element
  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setElements(prev =>
        prev.map(el => (el.id === id ? { ...el, ...updates } : el))
      );
    },
    [setElements]
  );

  // Delete an element
  const deleteElement = useCallback(
    (id: string) => {
      setElements(prev => prev.filter(el => el.id !== id));
      setSelectedElement(null);
    },
    [setElements, setSelectedElement]
  );

  // Duplicate an element
  const duplicateElementById = useCallback(
    (id: string) => {
      const element = elements.find(el => el.id === id);
      if (!element) return;

      const newElement = duplicateElement(element);
      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
    },
    [elements, setElements, setSelectedElement]
  );

  // Move an element by delta
  const moveElement = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      setElements(prev =>
        prev.map(el =>
          el.id === id
            ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
            : el
        )
      );
    },
    [setElements]
  );

  // Resize an element
  const resizeElement = useCallback(
    (id: string, width: number, height: number, x?: number, y?: number) => {
      setElements(prev =>
        prev.map(el =>
          el.id === id
            ? {
                ...el,
                width,
                height,
                ...(x !== undefined && { x }),
                ...(y !== undefined && { y }),
              }
            : el
        )
      );
    },
    [setElements]
  );

  // Bring element to front
  const bringElementToFront = useCallback(
    (id: string) => {
      setElements(prev => bringToFront(prev, id));
    },
    [setElements]
  );

  // Send element to back
  const sendElementToBack = useCallback(
    (id: string) => {
      setElements(prev => sendToBack(prev, id));
    },
    [setElements]
  );

  // Toggle element visibility
  const toggleElementVisibility = useCallback(
    (id: string) => {
      setElements(prev =>
        prev.map(el =>
          el.id === id ? { ...el, visible: !el.visible } : el
        )
      );
    },
    [setElements]
  );

  // Get element by ID
  const getElementById = useCallback(
    (id: string) => {
      return elements.find(el => el.id === id);
    },
    [elements]
  );

  return {
    addElement,
    updateElement,
    deleteElement,
    duplicateElementById,
    moveElement,
    resizeElement,
    bringElementToFront,
    sendElementToBack,
    toggleElementVisibility,
    getElementById,
  };
};
