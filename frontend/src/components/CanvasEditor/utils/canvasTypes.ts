/**
 * Canvas Editor Type Definitions
 * Shared types for canvas elements and configurations
 */

export interface CanvasElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'text' | 'table' | 'unit_name' | 'unit_class';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  image?: string;
  tableData?: string[][];
  isFixed?: boolean; // For unit_name and unit_class fields
  visible?: boolean; // For element visibility
  style?: CanvasElementStyle;
}

export interface CanvasElementStyle {
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  textDecoration?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  whiteSpace?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  headerBackgroundColor?: string;
  columnWidths?: number[];
}

export interface CanvasConfig {
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  canvasBorderWidth: number;
  canvasBorderColor: string;
}

export interface CanvasState extends CanvasConfig {
  elements: CanvasElement[];
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export interface DragState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  elementStart: { x: number; y: number };
}

export interface ResizeState {
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  resizeStart: { x: number; y: number; width: number; height: number };
}

export interface Flag {
  name: string;
  url: string;
}
