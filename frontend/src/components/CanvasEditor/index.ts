/**
 * Canvas Editor Module
 * Main barrel export for the refactored Canvas Editor
 */

// Main component (to be refactored)
export { default as CanvasEditor } from '../CanvasEditor';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Utils - export only types to avoid duplication
export type {
  CanvasElement,
  CanvasElementStyle,
  CanvasConfig,
  CanvasState,
  ResizeHandle,
  DragState,
  ResizeState,
  Flag
} from './utils/canvasTypes';
export * from './utils/canvasConstants';
export * from './utils/elementHelpers';
