import { useCallback, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SnapLine {
  position: number;
  orientation: 'horizontal' | 'vertical';
  type: 'grid' | 'element' | 'canvas';
}

interface CanvasElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseCanvasSnapProps {
  canvasWidth: number;
  canvasHeight: number;
  elements: CanvasElement[];
  gridSize?: number;
  snapTolerance?: number;
  enableGrid?: boolean;
  enableElements?: boolean;
  enableCanvas?: boolean;
}

export const useCanvasSnap = ({
  canvasWidth,
  canvasHeight,
  elements,
  gridSize = 10,
  snapTolerance = 5,
  enableGrid = true,
  enableElements = true,
  enableCanvas = true
}: UseCanvasSnapProps) => {
  
  // Generate snap lines
  const snapLines = useMemo(() => {
    const lines: SnapLine[] = [];

    // Grid lines
    if (enableGrid) {
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        lines.push({ position: x, orientation: 'vertical', type: 'grid' });
      }
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        lines.push({ position: y, orientation: 'horizontal', type: 'grid' });
      }
    }

    // Canvas edge lines
    if (enableCanvas) {
      lines.push(
        { position: 0, orientation: 'vertical', type: 'canvas' },
        { position: canvasWidth, orientation: 'vertical', type: 'canvas' },
        { position: 0, orientation: 'horizontal', type: 'canvas' },
        { position: canvasHeight, orientation: 'horizontal', type: 'canvas' },
        // Center lines
        { position: canvasWidth / 2, orientation: 'vertical', type: 'canvas' },
        { position: canvasHeight / 2, orientation: 'horizontal', type: 'canvas' }
      );
    }

    // Element alignment lines
    if (enableElements) {
      elements.forEach(element => {
        const { x, y, width, height } = element;
        
        // Vertical lines (left, center, right)
        lines.push(
          { position: x, orientation: 'vertical', type: 'element' },
          { position: x + width / 2, orientation: 'vertical', type: 'element' },
          { position: x + width, orientation: 'vertical', type: 'element' }
        );
        
        // Horizontal lines (top, center, bottom)
        lines.push(
          { position: y, orientation: 'horizontal', type: 'element' },
          { position: y + height / 2, orientation: 'horizontal', type: 'element' },
          { position: y + height, orientation: 'horizontal', type: 'element' }
        );
      });
    }

    return lines;
  }, [canvasWidth, canvasHeight, elements, gridSize, enableGrid, enableElements, enableCanvas]);

  // Snap function
  const snapToLines = useCallback((x: number, y: number, width: number, height: number, excludeId?: string) => {
    const snappedX = x;
    const snappedY = y;
    const activeSnapLines: SnapLine[] = [];

    // Filter out elements with excludeId
    const relevantElements = elements.filter(el => el.id !== excludeId);
    
    // Get relevant snap lines for current position
    const relevantLines = snapLines.filter(line => {
      // For element-based lines, exclude the current element
      if (line.type === 'element') {
        const elementAtLine = elements.find(el => {
          if (el.id === excludeId) return false;
          
          return (line.orientation === 'vertical' && 
                  (el.x === line.position || el.x + el.width === line.position || el.x + el.width/2 === line.position)) ||
                 (line.orientation === 'horizontal' && 
                  (el.y === line.position || el.y + el.height === line.position || el.y + el.height/2 === line.position));
        });
        return !!elementAtLine;
      }
      return true;
    });

    let finalX = x;
    let finalY = y;

    // Vertical snapping (X coordinate)
    const verticalLines = relevantLines.filter(line => line.orientation === 'vertical');
    const elementLeftEdge = x;
    const elementCenterX = x + width / 2;
    const elementRightEdge = x + width;

    for (const line of verticalLines) {
      // Snap left edge
      if (Math.abs(elementLeftEdge - line.position) <= snapTolerance) {
        finalX = line.position;
        activeSnapLines.push(line);
        break;
      }
      // Snap center
      if (Math.abs(elementCenterX - line.position) <= snapTolerance) {
        finalX = line.position - width / 2;
        activeSnapLines.push(line);
        break;
      }
      // Snap right edge
      if (Math.abs(elementRightEdge - line.position) <= snapTolerance) {
        finalX = line.position - width;
        activeSnapLines.push(line);
        break;
      }
    }

    // Horizontal snapping (Y coordinate)
    const horizontalLines = relevantLines.filter(line => line.orientation === 'horizontal');
    const elementTopEdge = y;
    const elementCenterY = y + height / 2;
    const elementBottomEdge = y + height;

    for (const line of horizontalLines) {
      // Snap top edge
      if (Math.abs(elementTopEdge - line.position) <= snapTolerance) {
        finalY = line.position;
        activeSnapLines.push(line);
        break;
      }
      // Snap center
      if (Math.abs(elementCenterY - line.position) <= snapTolerance) {
        finalY = line.position - height / 2;
        activeSnapLines.push(line);
        break;
      }
      // Snap bottom edge
      if (Math.abs(elementBottomEdge - line.position) <= snapTolerance) {
        finalY = line.position - height;
        activeSnapLines.push(line);
        break;
      }
    }

    return {
      x: finalX,
      y: finalY,
      snappedX: finalX !== x,
      snappedY: finalY !== y,
      activeSnapLines
    };
  }, [snapLines, elements, snapTolerance]);

  // Get visible guide lines for rendering
  const getVisibleGuides = useCallback((activeSnapLines: SnapLine[]) => {
    return activeSnapLines.map(line => ({
      ...line,
      style: {
        position: 'absolute' as const,
        [line.orientation === 'vertical' ? 'left' : 'top']: `${line.position}px`,
        [line.orientation === 'vertical' ? 'top' : 'left']: '0px',
        [line.orientation === 'vertical' ? 'width' : 'height']: '1px',
        [line.orientation === 'vertical' ? 'height' : 'width']: line.orientation === 'vertical' ? `${canvasHeight}px` : `${canvasWidth}px`,
        backgroundColor: line.type === 'grid' ? '#e5e7eb' : line.type === 'canvas' ? '#3b82f6' : '#ef4444',
        opacity: line.type === 'grid' ? 0.3 : 0.8,
        pointerEvents: 'none' as const,
        zIndex: line.type === 'grid' ? 1 : 10
      }
    }));
  }, [canvasWidth, canvasHeight]);

  return {
    snapToLines,
    getVisibleGuides,
    snapLines
  };
};