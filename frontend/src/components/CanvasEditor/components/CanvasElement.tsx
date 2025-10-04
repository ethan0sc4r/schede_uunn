/**
 * CanvasElement Component
 * Renders a single canvas element with drag/resize capabilities
 */

import { memo, useRef, useCallback } from 'react';
import type { CanvasElement as CanvasElementType, ResizeHandle } from '../utils/canvasTypes';
import { getImageUrl } from '../../../utils/imageUtils';
import { RESIZE_HANDLES } from '../utils/canvasConstants';

interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent, element: CanvasElementType) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  zoomLevel?: number;
}

function CanvasElement({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onResizeStart,
  zoomLevel = 1,
}: CanvasElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      onDragStart(e, element);
    },
    [onSelect, onDragStart, element]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      onResizeStart(e, handle);
    },
    [onResizeStart]
  );

  // Don't render if hidden
  if (element.visible === false) {
    return null;
  }

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    cursor: isSelected ? 'move' : 'pointer',
    border: isSelected ? '2px solid #3b82f6' : element.style?.borderWidth
      ? `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${
          element.style.borderColor || '#000'
        }`
      : 'none',
    backgroundColor: element.style?.backgroundColor || 'transparent',
    borderRadius: `${element.style?.borderRadius || 0}px`,
    overflow: 'hidden',
    userSelect: 'none',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
      case 'unit_name':
      case 'unit_class':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${element.style?.fontSize || 16}px`,
              fontWeight: element.style?.fontWeight || 'normal',
              fontStyle: element.style?.fontStyle || 'normal',
              fontFamily: element.style?.fontFamily || 'Arial',
              color: element.style?.color || '#000',
              textAlign: element.style?.textAlign || 'left',
              padding: '4px',
              wordWrap: 'break-word',
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.style?.textAlign === 'center' ? 'center' :
                            element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {element.content || ''}
          </div>
        );

      case 'logo':
      case 'flag':
      case 'silhouette':
        return element.image ? (
          <img
            src={element.image.startsWith('http') ? element.image : getImageUrl(element.image)}
            alt={element.type}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              color: '#9ca3af',
              fontSize: '12px',
            }}
          >
            {element.type === 'logo' && 'Logo'}
            {element.type === 'flag' && 'Bandiera'}
            {element.type === 'silhouette' && 'Silhouette'}
          </div>
        );

      case 'table':
        return (
          <table
            style={{
              width: '100%',
              height: '100%',
              borderCollapse: 'collapse',
              fontSize: `${element.style?.fontSize || 12}px`,
            }}
          >
            <tbody>
              {element.tableData?.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      style={{
                        border: `1px solid ${element.style?.borderColor || '#000'}`,
                        padding: '4px',
                        backgroundColor:
                          rowIndex === 0
                            ? element.style?.headerBackgroundColor || '#f3f4f6'
                            : 'transparent',
                        fontWeight: rowIndex === 0 ? 'bold' : 'normal',
                        textAlign: 'left',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={elementRef}
      style={baseStyle}
      onMouseDown={handleMouseDown}
      className="canvas-element"
    >
      {renderContent()}

      {/* Resize Handles - only show when selected */}
      {isSelected && (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                border: '1px solid white',
                borderRadius: '50%',
                cursor: `${handle}-resize`,
                zIndex: 30,
                ...getHandlePosition(handle),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/**
 * Get position styles for resize handle
 */
function getHandlePosition(handle: ResizeHandle): React.CSSProperties {
  const offset = -4; // Half of handle size

  switch (handle) {
    case 'nw':
      return { top: offset, left: offset };
    case 'ne':
      return { top: offset, right: offset };
    case 'sw':
      return { bottom: offset, left: offset };
    case 'se':
      return { bottom: offset, right: offset };
    case 'n':
      return { top: offset, left: '50%', transform: 'translateX(-50%)' };
    case 's':
      return { bottom: offset, left: '50%', transform: 'translateX(-50%)' };
    case 'e':
      return { top: '50%', right: offset, transform: 'translateY(-50%)' };
    case 'w':
      return { top: '50%', left: offset, transform: 'translateY(-50%)' };
    default:
      return {};
  }
}

export default memo(CanvasElement, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.element === nextProps.element &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.zoomLevel === nextProps.zoomLevel
  );
});
