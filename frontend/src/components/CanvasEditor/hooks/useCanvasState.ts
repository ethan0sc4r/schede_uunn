/**
 * useCanvasState Hook
 * Manages the main canvas state including elements, dimensions, and configuration
 */

import { useState, useEffect } from 'react';
import type { NavalUnit } from '../../../types';
import type { CanvasElement, CanvasConfig } from '../utils/canvasTypes';
import { DEFAULT_CANVAS_CONFIG } from '../utils/canvasConstants';

interface UseCanvasStateProps {
  unit?: NavalUnit | null;
}

interface UseCanvasStateReturn extends CanvasConfig {
  // Elements
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;

  // Canvas dimensions
  setCanvasWidth: React.Dispatch<React.SetStateAction<number>>;
  setCanvasHeight: React.Dispatch<React.SetStateAction<number>>;

  // Canvas styling
  setCanvasBackground: React.Dispatch<React.SetStateAction<string>>;
  setCanvasBorderWidth: React.Dispatch<React.SetStateAction<number>>;
  setCanvasBorderColor: React.Dispatch<React.SetStateAction<string>>;

  // Selection
  selectedElement: string | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<string | null>>;

  // Visibility
  visibleElements: { [key: string]: boolean };
  setVisibleElements: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;

  // Zoom
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;

  // Utility
  getCanvasState: () => {
    elements: CanvasElement[];
    canvasWidth: number;
    canvasHeight: number;
    canvasBackground: string;
    canvasBorderWidth: number;
    canvasBorderColor: string;
  };
}

export const useCanvasState = ({ unit }: UseCanvasStateProps): UseCanvasStateReturn => {
  // Elements state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [visibleElements, setVisibleElements] = useState<{ [key: string]: boolean }>({});

  // Canvas configuration
  const [canvasWidth, setCanvasWidth] = useState(
    unit?.layout_config?.canvasWidth || DEFAULT_CANVAS_CONFIG.width
  );
  const [canvasHeight, setCanvasHeight] = useState(
    unit?.layout_config?.canvasHeight || DEFAULT_CANVAS_CONFIG.height
  );
  const [canvasBackground, setCanvasBackground] = useState(
    unit?.layout_config?.canvasBackground || DEFAULT_CANVAS_CONFIG.background
  );
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(
    unit?.layout_config?.canvasBorderWidth || DEFAULT_CANVAS_CONFIG.borderWidth
  );
  const [canvasBorderColor, setCanvasBorderColor] = useState(
    unit?.layout_config?.canvasBorderColor || DEFAULT_CANVAS_CONFIG.borderColor
  );

  // UI state
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Initialize elements from unit's layout_config
  useEffect(() => {
    if (unit?.layout_config?.elements) {
      setElements(unit.layout_config.elements);

      // Initialize visibility state
      const visibility: { [key: string]: boolean } = {};
      unit.layout_config.elements.forEach((el: CanvasElement) => {
        visibility[el.id] = el.visible !== false;
      });
      setVisibleElements(visibility);
    }
  }, [unit?.id]); // Only run when unit ID changes

  // Helper function to get complete canvas state
  const getCanvasState = () => ({
    elements,
    canvasWidth,
    canvasHeight,
    canvasBackground,
    canvasBorderWidth,
    canvasBorderColor,
  });

  return {
    // Elements
    elements,
    setElements,

    // Canvas dimensions
    canvasWidth,
    canvasHeight,
    setCanvasWidth,
    setCanvasHeight,

    // Canvas styling
    canvasBackground,
    canvasBorderWidth,
    canvasBorderColor,
    setCanvasBackground,
    setCanvasBorderWidth,
    setCanvasBorderColor,

    // Selection
    selectedElement,
    setSelectedElement,

    // Visibility
    visibleElements,
    setVisibleElements,

    // Zoom
    zoomLevel,
    setZoomLevel,

    // Utility
    getCanvasState,
  };
};
