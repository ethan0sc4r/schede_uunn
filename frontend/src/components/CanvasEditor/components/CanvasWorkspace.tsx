/**
 * CanvasWorkspace Component
 * Main canvas workspace area with drag & drop and resize functionality
 */

import { memo, useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasElement as CanvasElementType, ResizeHandle } from '../utils/canvasTypes';
import CanvasElement from './CanvasElement';
import { calculateResizedDimensions, snapToGrid, constrainToCanvas } from '../utils/elementHelpers';
import { GRID_SNAP } from '../utils/canvasConstants';

interface CanvasWorkspaceProps {
  // Elements
  elements: CanvasElementType[];

  // Selected element
  selectedElementId: string | null;
  onElementSelect: (id: string | null) => void;

  // Canvas configuration
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  canvasBorderWidth: number;
  canvasBorderColor: string;

  // Element operations
  onElementMove: (id: string, x: number, y: number) => void;
  onElementResize: (id: string, width: number, height: number, x?: number, y?: number) => void;

  // Optional
  zoomLevel?: number;
  showGrid?: boolean;
}

function CanvasWorkspace({
  elements,
  selectedElementId,
  onElementSelect,
  canvasWidth,
  canvasHeight,
  canvasBackground,
  canvasBorderWidth,
  canvasBorderColor,
  onElementMove,
  onElementResize,
  zoomLevel = 1,
  showGrid = false,
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<CanvasElementType | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent, element: CanvasElementType) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomLevel;
      const mouseY = (e.clientY - rect.top) / zoomLevel;

      setIsDragging(true);
      setDragStart({ x: mouseX, y: mouseY });
      setDraggedElement(element);
    },
    [zoomLevel]
  );

  /**
   * Handle resize start
   */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      if (!selectedElementId) return;

      const element = elements.find((el) => el.id === selectedElementId);
      if (!element || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomLevel;
      const mouseY = (e.clientY - rect.top) / zoomLevel;

      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        x: mouseX,
        y: mouseY,
        width: element.width,
        height: element.height,
      });
    },
    [selectedElementId, elements, zoomLevel]
  );

  /**
   * Handle mouse move (drag or resize)
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomLevel;
      const mouseY = (e.clientY - rect.top) / zoomLevel;

      if (isDragging && draggedElement) {
        // Calculate new position
        const deltaX = mouseX - dragStart.x;
        const deltaY = mouseY - dragStart.y;

        let newX = draggedElement.x + deltaX;
        let newY = draggedElement.y + deltaY;

        // Apply grid snap if enabled
        if (GRID_SNAP.enabled) {
          newX = snapToGrid(newX, GRID_SNAP.size);
          newY = snapToGrid(newY, GRID_SNAP.size);
        }

        // Constrain to canvas
        const constrained = constrainToCanvas(
          { x: newX, y: newY, width: draggedElement.width, height: draggedElement.height },
          canvasWidth,
          canvasHeight
        );

        onElementMove(draggedElement.id, constrained.x, constrained.y);

        // Update drag start for next move
        setDragStart({ x: mouseX, y: mouseY });
      } else if (isResizing && resizeHandle && selectedElementId) {
        const element = elements.find((el) => el.id === selectedElementId);
        if (!element) return;

        // Calculate delta
        const deltaX = mouseX - resizeStart.x;
        const deltaY = mouseY - resizeStart.y;

        // Calculate new dimensions
        const newDimensions = calculateResizedDimensions(
          element,
          resizeHandle,
          deltaX,
          deltaY
        );

        // Apply grid snap if enabled
        if (GRID_SNAP.enabled) {
          newDimensions.x = snapToGrid(newDimensions.x, GRID_SNAP.size);
          newDimensions.y = snapToGrid(newDimensions.y, GRID_SNAP.size);
          newDimensions.width = snapToGrid(newDimensions.width, GRID_SNAP.size);
          newDimensions.height = snapToGrid(newDimensions.height, GRID_SNAP.size);
        }

        // Constrain to canvas
        const constrained = constrainToCanvas(newDimensions, canvasWidth, canvasHeight);

        onElementResize(
          selectedElementId,
          constrained.width,
          constrained.height,
          constrained.x,
          constrained.y
        );
      }
    },
    [
      isDragging,
      isResizing,
      draggedElement,
      dragStart,
      resizeHandle,
      resizeStart,
      selectedElementId,
      elements,
      zoomLevel,
      canvasWidth,
      canvasHeight,
      onElementMove,
      onElementResize,
    ]
  );

  /**
   * Handle mouse up (end drag or resize)
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedElement(null);
    setResizeHandle(null);
  }, []);

  /**
   * Handle canvas click (deselect)
   */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking on canvas background
      if (e.target === e.currentTarget) {
        onElementSelect(null);
      }
    },
    [onElementSelect]
  );

  // Attach global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const canvasStyle: React.CSSProperties = {
    width: `${canvasWidth}px`,
    height: `${canvasHeight}px`,
    backgroundColor: canvasBackground,
    border: `${canvasBorderWidth}px solid ${canvasBorderColor}`,
    position: 'relative',
    overflow: 'hidden',
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const gridStyle: React.CSSProperties = showGrid
    ? {
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SNAP.size}px ${GRID_SNAP.size}px`,
      }
    : {};

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8 flex items-start justify-center">
      <div
        ref={canvasRef}
        style={{ ...canvasStyle, ...gridStyle }}
        onClick={handleCanvasClick}
        className="canvas-workspace"
      >
        {/* Render all elements */}
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElementId}
            onSelect={() => onElementSelect(element.id)}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            zoomLevel={zoomLevel}
          />
        ))}

        {/* Canvas info overlay (optional) */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            pointerEvents: 'none',
          }}
        >
          {canvasWidth} × {canvasHeight}px
        </div>
      </div>
    </div>
  );
}

export default memo(CanvasWorkspace);
