import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Grid, Clock, Settings } from 'lucide-react';
import type { Group, NavalUnit, PresentationConfig } from '../types/index.ts';

interface PresentationModeProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationMode({ group, isOpen, onClose }: PresentationModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const config = group.presentation_config || {
    mode: 'single',
    interval: 5,
    grid_rows: 3,
    grid_cols: 3,
    auto_advance: true,
    page_duration: 10
  };

  const units = group.naval_units || [];
  const unitsPerPage = config.mode === 'grid' ? (config.grid_rows || 3) * (config.grid_cols || 3) : 1;
  const totalPages = Math.ceil(units.length / unitsPerPage);

  // Fullscreen functions
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-enter fullscreen when presentation starts
  useEffect(() => {
    if (isOpen && !isFullscreen) {
      enterFullscreen();
    }
  }, [isOpen]);

  // Handle closing
  const handleClose = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    }
    onClose();
  };

  // Get current units to display
  const getCurrentUnits = useCallback(() => {
    if (config.mode === 'single') {
      return units.slice(currentIndex, currentIndex + 1);
    } else {
      const startIndex = currentPage * unitsPerPage;
      return units.slice(startIndex, startIndex + unitsPerPage);
    }
  }, [config.mode, currentIndex, currentPage, units, unitsPerPage]);

  // Controls auto-hide logic (only when not in fullscreen)
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setShowControls(true);
    
    // Don't auto-hide in fullscreen
    if (!isFullscreen) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds
      setControlsTimeout(timeout);
    }
  }, [controlsTimeout, isFullscreen]);

  // Show controls on mouse movement and keyboard shortcuts
  useEffect(() => {
    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimeout();
      
      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          isPlaying ? handlePause() : handlePlay();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('keydown', handleKeyDown);
      resetControlsTimeout(); // Initial timeout
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('keydown', handleKeyDown);
        if (controlsTimeout) {
          clearTimeout(controlsTimeout);
        }
      };
    }
  }, [isOpen, resetControlsTimeout, isPlaying]);

  // Timer logic
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const duration = config.mode === 'single' 
      ? (config.interval || 5) * 1000
      : (config.page_duration || 10) * 1000;

    setTimeRemaining(duration / 1000);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto advance
          if (config.mode === 'single') {
            setCurrentIndex(prev => (prev + 1) % units.length);
          } else {
            setCurrentPage(prev => (prev + 1) % totalPages);
          }
          return duration / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isOpen, config, units.length, totalPages]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleNext = () => {
    if (config.mode === 'single') {
      setCurrentIndex(prev => (prev + 1) % units.length);
    } else {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }
    setTimeRemaining(config.mode === 'single' ? (config.interval || 5) : (config.page_duration || 10));
  };

  const handlePrevious = () => {
    if (config.mode === 'single') {
      setCurrentIndex(prev => (prev - 1 + units.length) % units.length);
    } else {
      setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    }
    setTimeRemaining(config.mode === 'single' ? (config.interval || 5) : (config.page_duration || 10));
  };

  const renderUnit = (unit: NavalUnit) => {
    // Create a modified layout with group template overrides
    const getModifiedElements = () => {
      if (!unit.layout_config?.elements) return [];
      
      return unit.layout_config.elements.map((element: any) => {
        // Apply group template overrides
        if (element.type === 'logo' && group.override_logo && group.template_logo_path) {
          return { ...element, image: group.template_logo_path };
        }
        if (element.type === 'flag' && group.override_flag && group.template_flag_path) {
          return { ...element, image: group.template_flag_path };
        }
        return element;
      });
    };

    const elements = getModifiedElements();
    const canvasBackground = unit.layout_config?.canvasBackground || '#ffffff';
    const canvasBorderWidth = unit.layout_config?.canvasBorderWidth || 4;
    const canvasBorderColor = unit.layout_config?.canvasBorderColor || '#000000';

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div 
          className="relative bg-white shadow-2xl"
          style={{ 
            width: '1123px', // A4 landscape width
            height: '794px',  // A4 landscape height
            backgroundColor: canvasBackground,
            borderWidth: canvasBorderWidth,
            borderColor: canvasBorderColor,
            borderStyle: 'solid',
            transform: isFullscreen ? 'scale(1)' : 'scale(0.95)', // 5% zoom out when not fullscreen
            transformOrigin: 'center'
          }}
        >
          {/* Render all canvas elements */}
          {elements.map((element: any) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                fontSize: element.style?.fontSize || 16,
                fontWeight: element.style?.fontWeight || 'normal',
                color: element.style?.color || '#000000',
                backgroundColor: element.style?.backgroundColor || 'transparent',
                borderRadius: element.style?.borderRadius || 0,
                borderWidth: element.style?.borderWidth || 0,
                borderColor: element.style?.borderColor || 'transparent',
                borderStyle: element.style?.borderStyle || 'solid',
                textAlign: element.style?.textAlign || 'left',
                whiteSpace: element.style?.whiteSpace || 'normal'
              }}
            >
              {/* Text elements */}
              {(element.type === 'text' || element.type === 'unit_name' || element.type === 'unit_class') && (
                <div className="w-full h-full flex items-center px-2">
                  {element.content}
                </div>
              )}

              {/* Image elements */}
              {(element.type === 'logo' || element.type === 'flag' || element.type === 'silhouette') && element.image && (
                <img
                  src={element.image}
                  alt={element.type}
                  className="w-full h-full object-contain"
                  style={{
                    borderRadius: element.style?.borderRadius || 0
                  }}
                />
              )}

              {/* Table elements */}
              {element.type === 'table' && element.tableData && (
                <div className="w-full h-full overflow-auto p-1">
                  <table className="w-full border-collapse">
                    <tbody>
                      {element.tableData.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell: string, colIndex: number) => {
                            const isHeader = rowIndex === 0;
                            const bgColor = colIndex % 2 === 0 ? '#f3f4f6' : '#ffffff';
                            
                            return (
                              <td
                                key={colIndex}
                                className={`border border-gray-400 px-1 py-0.5 text-xs ${
                                  isHeader ? 'font-bold bg-gray-300' : ''
                                }`}
                                style={{
                                  backgroundColor: isHeader ? '#d1d5db' : bgColor,
                                  fontSize: '10px',
                                  lineHeight: '1.2'
                                }}
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const currentUnits = getCurrentUnits();

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Floating Header Controls */}
      <div className={`absolute top-4 left-4 right-4 z-10 flex items-center justify-between transition-opacity duration-300 ${
        showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center space-x-4 bg-black bg-opacity-70 text-white p-3 rounded-lg backdrop-blur-sm">
          <h2 className="text-lg font-bold">{group.name}</h2>
          <div className="flex items-center space-x-2 text-gray-300">
            {config.mode === 'single' ? (
              <>
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Unità {currentIndex + 1} di {units.length}
                </span>
              </>
            ) : (
              <>
                <Grid className="h-4 w-4" />
                <span className="text-sm">
                  Pagina {currentPage + 1} di {totalPages} • Griglia {config.grid_rows}×{config.grid_cols}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 hidden lg:block">
            ← → Naviga • Spazio Avanti • P Play/Pausa • Esc Esci
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-black bg-opacity-70 p-3 rounded-lg backdrop-blur-sm">
          {/* Timer */}
          <div className="flex items-center space-x-2 text-white">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors"
              title="Precedente"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            
            {isPlaying ? (
              <button
                onClick={handlePause}
                className="p-2 bg-red-500 bg-opacity-80 hover:bg-opacity-90 text-white rounded-lg transition-colors"
                title="Pausa"
              >
                <Pause className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="p-2 bg-green-500 bg-opacity-80 hover:bg-opacity-90 text-white rounded-lg transition-colors"
                title="Play"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors"
              title="Successivo"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleClose}
            className="p-2 bg-red-500 bg-opacity-80 hover:bg-opacity-90 text-white rounded-lg transition-colors"
            title="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full bg-gray-900 overflow-hidden">
        {config.mode === 'single' ? (
          // Single Mode - Full screen
          <div className="w-full h-full">
            {currentUnits.length > 0 && renderUnit(currentUnits[0])}
          </div>
        ) : (
          // Grid Mode - Scaled units with padding to avoid header
          <div className="pt-20 pb-4 px-4 h-full">
            <div 
              className="grid gap-4 h-full"
              style={{
                gridTemplateColumns: `repeat(${config.grid_cols || 3}, 1fr)`,
                gridTemplateRows: `repeat(${config.grid_rows || 3}, 1fr)`
              }}
            >
              {currentUnits.map((unit, index) => (
                <div key={unit.id} className="min-h-0 overflow-hidden">
                  <div className="w-full h-full transform scale-75 origin-top-left">
                    <div style={{ width: '133.33%', height: '133.33%' }}>
                      {renderUnit(unit)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Fill empty slots if needed */}
              {Array.from({ length: unitsPerPage - currentUnits.length }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <span className="text-gray-400">Vuoto</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Progress Bar */}
      <div className={`absolute bottom-4 left-4 right-4 z-10 transition-opacity duration-300 ${
        showControls || isFullscreen ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-black bg-opacity-70 p-2 rounded-lg backdrop-blur-sm">
          <div className="bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: config.mode === 'single'
                  ? `${((currentIndex + 1) / units.length) * 100}%`
                  : `${((currentPage + 1) / totalPages) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}