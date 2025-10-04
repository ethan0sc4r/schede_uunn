/**
 * Element Helper Functions
 * Utility functions for canvas element operations
 */

import type { CanvasElement, ResizeHandle } from './canvasTypes';
import { DEFAULT_ELEMENT_DIMENSIONS, DEFAULT_ELEMENT_STYLES, MIN_ELEMENT_DIMENSIONS } from './canvasConstants';

/**
 * Generate a unique ID for canvas elements
 */
export const generateElementId = (): string => {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new canvas element with default properties
 */
export const createElement = (
  type: CanvasElement['type'],
  x: number = 50,
  y: number = 50,
  overrides?: Partial<CanvasElement>
): CanvasElement => {
  const dimensions = DEFAULT_ELEMENT_DIMENSIONS[type];
  const style = DEFAULT_ELEMENT_STYLES[type] || {};

  return {
    id: generateElementId(),
    type,
    x,
    y,
    width: dimensions.width,
    height: dimensions.height,
    visible: true,
    style: { ...style },
    ...overrides,
  };
};

/**
 * Duplicate an existing element with a new ID
 */
export const duplicateElement = (element: CanvasElement): CanvasElement => {
  return {
    ...element,
    id: generateElementId(),
    x: element.x + 20, // Offset slightly
    y: element.y + 20,
  };
};

/**
 * Calculate new dimensions based on resize handle and mouse movement
 */
export const calculateResizedDimensions = (
  element: CanvasElement,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number
): { x: number; y: number; width: number; height: number } => {
  let { x, y, width, height } = element;

  switch (handle) {
    case 'nw':
      x += deltaX;
      y += deltaY;
      width -= deltaX;
      height -= deltaY;
      break;
    case 'ne':
      y += deltaY;
      width += deltaX;
      height -= deltaY;
      break;
    case 'sw':
      x += deltaX;
      width -= deltaX;
      height += deltaY;
      break;
    case 'se':
      width += deltaX;
      height += deltaY;
      break;
    case 'n':
      y += deltaY;
      height -= deltaY;
      break;
    case 's':
      height += deltaY;
      break;
    case 'e':
      width += deltaX;
      break;
    case 'w':
      x += deltaX;
      width -= deltaX;
      break;
  }

  // Enforce minimum dimensions
  if (width < MIN_ELEMENT_DIMENSIONS.width) {
    width = MIN_ELEMENT_DIMENSIONS.width;
    if (handle.includes('w')) {
      x = element.x + element.width - width;
    }
  }

  if (height < MIN_ELEMENT_DIMENSIONS.height) {
    height = MIN_ELEMENT_DIMENSIONS.height;
    if (handle.includes('n')) {
      y = element.y + element.height - height;
    }
  }

  return { x, y, width, height };
};

/**
 * Snap value to grid
 */
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Check if a point is inside an element's bounds
 */
export const isPointInElement = (
  point: { x: number; y: number },
  element: CanvasElement
): boolean => {
  return (
    point.x >= element.x &&
    point.x <= element.x + element.width &&
    point.y >= element.y &&
    point.y <= element.y + element.height
  );
};

/**
 * Get the element at a specific point (topmost element)
 */
export const getElementAtPoint = (
  point: { x: number; y: number },
  elements: CanvasElement[]
): CanvasElement | null => {
  // Iterate in reverse to get topmost element
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isPointInElement(point, elements[i])) {
      return elements[i];
    }
  }
  return null;
};

/**
 * Ensure element stays within canvas bounds
 */
export const constrainToCanvas = (
  element: { x: number; y: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } => {
  let { x, y, width, height } = element;

  // Constrain position
  x = Math.max(0, Math.min(x, canvasWidth - width));
  y = Math.max(0, Math.min(y, canvasHeight - height));

  // Constrain size if element is too big
  if (width > canvasWidth) {
    width = canvasWidth;
    x = 0;
  }
  if (height > canvasHeight) {
    height = canvasHeight;
    y = 0;
  }

  return { x, y, width, height };
};

/**
 * Sort elements by z-index (simulated by array order)
 */
export const bringToFront = (
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] => {
  const element = elements.find(el => el.id === elementId);
  if (!element) return elements;

  return [
    ...elements.filter(el => el.id !== elementId),
    element,
  ];
};

/**
 * Send element to back
 */
export const sendToBack = (
  elements: CanvasElement[],
  elementId: string
): CanvasElement[] => {
  const element = elements.find(el => el.id === elementId);
  if (!element) return elements;

  return [
    element,
    ...elements.filter(el => el.id !== elementId),
  ];
};

/**
 * Get default content for element type
 */
export const getDefaultContent = (type: CanvasElement['type']): string => {
  switch (type) {
    case 'unit_name':
      return 'Nome Unità';
    case 'unit_class':
      return 'Classe Unità';
    case 'text':
      return 'Testo';
    default:
      return '';
  }
};
