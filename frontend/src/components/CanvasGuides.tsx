import React from 'react';

interface Guide {
  position: number;
  orientation: 'horizontal' | 'vertical';
  type: 'grid' | 'element' | 'canvas';
  style: React.CSSProperties;
}

interface CanvasGuidesProps {
  guides: Guide[];
  showGrid?: boolean;
  canvasWidth: number;
  canvasHeight: number;
  gridSize?: number;
}

const CanvasGuides: React.FC<CanvasGuidesProps> = ({ 
  guides, 
  showGrid = true, 
  canvasWidth, 
  canvasHeight,
  gridSize = 10
}) => {
  // Generate grid dots instead of lines for better performance
  const gridDots = React.useMemo(() => {
    if (!showGrid) return [];
    
    const dots = [];
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        dots.push({ x, y });
      }
    }
    return dots;
  }, [showGrid, canvasWidth, canvasHeight, gridSize]);

  return (
    <>
      {/* Grid dots */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          {gridDots.map((dot, index) => (
            <div
              key={index}
              className="absolute w-px h-px bg-gray-300"
              style={{
                left: dot.x,
                top: dot.y,
                opacity: 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* Active snap guides */}
      {guides.map((guide, index) => (
        <div
          key={`${guide.orientation}-${guide.position}-${index}`}
          style={guide.style}
          className={`absolute pointer-events-none ${
            guide.type === 'canvas' ? 'bg-blue-500' : 
            guide.type === 'element' ? 'bg-red-500' : 'bg-gray-300'
          }`}
        />
      ))}
    </>
  );
};

export default CanvasGuides;