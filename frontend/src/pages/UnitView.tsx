import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, FileImage, Printer, Presentation, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { navalUnitsApi, templatesApi } from '../services/api';
import { printCanvas } from '../utils/exportUtils';
import { getImageUrl } from '../utils/imageUtils';
import type { NavalUnit } from '../types/index.ts';
import { useToast } from '../contexts/ToastContext';

export default function UnitView() {
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useToast();
  const [unit, setUnit] = useState<NavalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [viewZoom, setViewZoom] = useState(100);
  const [viewOffsetX, setViewOffsetX] = useState(0);
  const [viewOffsetY, setViewOffsetY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUnit = async () => {
      if (!id) return;
      
      try {
        // First try the public endpoint (no authentication required)
        const unitData = await navalUnitsApi.getByIdPublic(parseInt(id));
        setUnit(unitData);
        console.log('✅ Unit loaded via public endpoint:', unitData.name);
      } catch (err: any) {
        // If public endpoint fails, try the authenticated endpoint as fallback
        try {
          const unitData = await navalUnitsApi.getById(parseInt(id));
          setUnit(unitData);
          console.log('✅ Unit loaded via authenticated endpoint:', unitData.name);
        } catch (authErr) {
          setError('Errore nel caricamento della scheda. La scheda potrebbe non esistere o non essere disponibile pubblicamente.');
          console.error('❌ Both endpoints failed:', { publicError: err, authError: authErr });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
  }, [id]);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await templatesApi.getAll();
        setAvailableTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
        setAvailableTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
        setViewZoom(100);
        setViewOffsetX(0);
        setViewOffsetY(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  const handlePrint = async () => {
    if (!unit || !canvasRef.current) {
      showError('Errore: Canvas non disponibile per la stampa');
      return;
    }
    
    console.log('Starting print for:', unit.name);
    console.log('Canvas ref element:', canvasRef.current);
    
    try {
      await printCanvas(canvasRef.current);
      console.log('Print initiated successfully');
    } catch (error: any) {
      console.error('Print error:', error);
      showError(`Errore durante la stampa: ${error.message || error}`);
    }
  };

  const handleExportPNG = async () => {
    if (!unit) {
      showError('Errore: Unità non disponibile per l\'esportazione');
      return;
    }
    
    console.log('Starting server-side PNG export for:', unit.name);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      
      // Try public endpoint first, then authenticated endpoint as fallback
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/public/units/${unit.id}/export/png`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (publicError) {
        console.log('Public PNG export failed, trying authenticated endpoint...');
        response = await fetch(`${API_BASE_URL}/api/units/${unit.id}/export/png`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PNG export error response:', response.status, errorText);
        throw new Error(`Errore durante l'export PNG: ${response.status} - ${errorText}`);
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${unit.name.replace(/\s+/g, '_')}_scheda.png`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log('PNG export completed successfully');
      success(`PNG di "${unit.name}" esportato con successo!`);
    } catch (error: any) {
      console.error('PNG export error:', error);
      showError(`Errore durante l'esportazione PNG: ${error.message || error}`);
    }
  };


  const handleExportPowerPointWithTemplate = async (templateConfig: any = null) => {
    if (!unit) {
      showError('Errore: Unità non disponibile per l\'esportazione');
      return;
    }
    
    console.log('Starting PowerPoint export for unit:', unit.id);
    console.log('🎨 Template config being sent:', templateConfig);
    console.log('📋 Unit layout config:', unit.layout_config);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      
      // Extract only canvas properties for template config
    let finalTemplateConfig = templateConfig;
    if (!finalTemplateConfig && unit.layout_config) {
      finalTemplateConfig = {
        canvasWidth: unit.layout_config.canvasWidth,
        canvasHeight: unit.layout_config.canvasHeight,
        canvasBackground: unit.layout_config.canvasBackground,
        canvasBorderWidth: unit.layout_config.canvasBorderWidth,
        canvasBorderColor: unit.layout_config.canvasBorderColor
      };
    }
      console.log('🔍 PowerPoint export starting from View:', {
        unitId: unit.id,
        apiUrl: `${API_BASE_URL}/api/units/${unit.id}/export/powerpoint`,
        finalTemplateConfig: finalTemplateConfig
      });
      
      // Try public endpoint first, then authenticated endpoint as fallback
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/public/units/${unit.id}/export/powerpoint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_config: finalTemplateConfig
          })
        });
      } catch (publicError) {
        console.log('Public export failed, trying authenticated endpoint...');
        response = await fetch(`${API_BASE_URL}/api/units/${unit.id}/export/powerpoint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            template_config: finalTemplateConfig
          })
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PowerPoint export error response:', response.status, errorText);

        if (response.status === 401) {
          showError('Sessione scaduta. Ricarica la pagina e rieffettua il login.');
          return;
        }

        throw new Error(`Errore durante l'export PowerPoint: ${response.status} - ${errorText}`);
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${unit.name}_${unit.unit_class}.pptx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log('PowerPoint export completed successfully');
      success(`PowerPoint di "${unit.name}" esportato con successo!`);
    } catch (error: any) {
      console.error('PowerPoint export error:', error);
      showError(`Errore durante l'esportazione PowerPoint: ${error.message || error}`);
    }
  };

  const handleExportPowerPoint = () => {
    setShowTemplateSelector(true);
  };

  const handleShare = async () => {
    if (!unit) return;
    const shareUrl = window.location.href;
    const shareMessage = `Nave ${unit.name} classe ${unit.unit_class} è stato copiato in memoria`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      success(shareMessage);
    } catch (error) {
      console.error('Errore copia link:', error);
      showError('Errore durante la copia del link');
    }
  };

  const renderCanvas = () => {
    if (!unit) return null;
    
    // Use layout_config if available, otherwise create basic elements from direct fields
    const elements = unit.layout_config?.elements || [];
    const canvasConfig = unit.layout_config || {
      canvasWidth: 1123,
      canvasHeight: 794,
      canvasBackground: '#ffffff',
      canvasBorderWidth: 4,
      canvasBorderColor: '#000000'
    };
    
    // If no elements but unit has direct image fields, create basic elements
    if (elements.length === 0 && (unit.logo_path || unit.flag_path || unit.silhouette_path)) {
      const basicElements = [];
      
      if (unit.logo_path) {
        basicElements.push({
          id: 'logo',
          type: 'logo',
          x: 20,
          y: 20,
          width: 120,
          height: 120,
          image: unit.logo_path,
          style: { backgroundColor: '#ffffff', borderRadius: 8 }
        });
      }
      
      if (unit.flag_path) {
        basicElements.push({
          id: 'flag',
          type: 'flag',
          x: 983,
          y: 20,
          width: 120,
          height: 80,
          image: unit.flag_path,
          style: { backgroundColor: '#ffffff', borderRadius: 8 }
        });
      }
      
      // Check for silhouette in unit.silhouette_path or layout_config.elements
      let silhouetteImage = unit.silhouette_path;
      if (!silhouetteImage) {
        const silhouetteElement = unit.layout_config?.elements?.find((el: any) => el.type === 'silhouette');
        silhouetteImage = silhouetteElement?.image;
      }
      
      if (silhouetteImage) {
        basicElements.push({
          id: 'silhouette',
          type: 'silhouette',
          x: 20,
          y: 180,
          width: 1083,
          height: 300,
          image: silhouetteImage,
          style: { backgroundColor: '#ffffff', borderRadius: 8 }
        });
      }
      
      // Add basic unit info
      basicElements.push({
        id: 'unit_name',
        type: 'unit_name',
        x: 160,
        y: 30,
        width: 400,
        height: 40,
        content: unit.name,
        style: { fontSize: 24, fontWeight: 'bold', color: '#000' }
      });
      
      basicElements.push({
        id: 'unit_class',
        type: 'unit_class',
        x: 160,
        y: 80,
        width: 400,
        height: 40,
        content: unit.unit_class,
        style: { fontSize: 20, fontWeight: 'normal', color: '#000' }
      });
      
      return renderCanvasWithElements(basicElements, canvasConfig);
    }
    
    return renderCanvasWithElements(elements, canvasConfig);
  };
  
  const renderCanvasWithElements = (elements: any[], canvasConfig: any) => {
    return (
      <div className="relative bg-white shadow-xl rounded-lg overflow-visible">
        <div 
          ref={canvasRef}
          data-export-target="true"
          className="block"
          style={{ 
            width: canvasConfig.canvasWidth || 1123, 
            height: canvasConfig.canvasHeight || 794,
            backgroundColor: canvasConfig.canvasBackground || '#ffffff',
            borderWidth: canvasConfig.canvasBorderWidth || 4,
            borderColor: canvasConfig.canvasBorderColor || '#000000',
            borderStyle: 'solid',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          {elements.map((element: any) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                backgroundColor: element.style?.backgroundColor,
                borderRadius: element.style?.borderRadius,
                borderWidth: element.style?.borderWidth || 0,
                borderColor: element.style?.borderColor || '#000000',
                borderStyle: element.style?.borderStyle || 'solid',
              }}
            >
              {/* Render content based on element type */}
              {(element.type === 'text' || element.type === 'unit_name' || element.type === 'unit_class') && (
                <div
                  className="w-full h-full flex items-center justify-start px-2"
                  style={{
                    fontSize: element.style?.fontSize,
                    fontWeight: element.style?.fontWeight,
                    color: element.style?.color,
                    whiteSpace: element.style?.whiteSpace,
                  }}
                >
                  <div style={{ whiteSpace: 'pre-line' }}>{element.content}</div>
                </div>
              )}

              {element.type === 'logo' && (
                <div className="w-full h-full flex items-center justify-center">
                  {element.image ? (
                    <img
                      src={getImageUrl(element.image)}
                      alt={element.type}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        display: 'block',
                        borderRadius: element.style?.borderRadius || 0
                      }}
                      onError={(e) => {
                        console.error('Error loading image:', element.image);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', element.type);
                      }}
                    />
                  ) : (
                    <div className="text-gray-600 text-center text-sm font-bold">LOGO</div>
                  )}
                </div>
              )}

              {element.type === 'silhouette' && (() => {
                // Main image (silhouette)
                const mainImage = element.image;

                // Gallery images
                const galleryImages: string[] = [];
                if (unit?.gallery && unit.gallery.length > 0) {
                  unit.gallery.forEach(img => {
                    if (img.image_path) {
                      galleryImages.push(img.image_path);
                    }
                  });
                }

                // Create slides: [main image slide, ...gallery group slides]
                const slides: Array<{ type: 'main' | 'group', images: string[] }> = [];

                // Slide 0: Main image
                if (mainImage) {
                  slides.push({ type: 'main', images: [mainImage] });
                }

                // Group gallery images into slides: groups of 4, then 2, then singles
                let remainingImages = [...galleryImages];

                // First, make groups of 4
                while (remainingImages.length >= 4) {
                  slides.push({ type: 'group', images: remainingImages.slice(0, 4) });
                  remainingImages = remainingImages.slice(4);
                }

                // Then groups of 2
                while (remainingImages.length >= 2) {
                  slides.push({ type: 'group', images: remainingImages.slice(0, 2) });
                  remainingImages = remainingImages.slice(2);
                }

                // Finally singles
                while (remainingImages.length > 0) {
                  slides.push({ type: 'group', images: [remainingImages[0]] });
                  remainingImages = remainingImages.slice(1);
                }

                const totalSlides = slides.length;
                const hasMultipleSlides = totalSlides > 1;
                const currentSlide = slides[currentSlideIndex] || slides[0];

                return (
                  <>
                    <div className="w-full h-full flex items-center justify-center relative">
                      {currentSlide.type === 'main' ? (
                        // Main image slide - full size with zoom/pan
                        <div
                          className="w-full h-full flex items-center justify-center cursor-move bg-white rounded"
                          style={{ overflow: 'hidden' }}
                          onMouseDown={(e) => {
                            setIsPanning(true);
                            setPanStart({ x: e.clientX - viewOffsetX, y: e.clientY - viewOffsetY });
                          }}
                          onMouseMove={(e) => {
                            if (isPanning) {
                              setViewOffsetX(e.clientX - panStart.x);
                              setViewOffsetY(e.clientY - panStart.y);
                            }
                          }}
                          onMouseUp={() => setIsPanning(false)}
                          onMouseLeave={() => setIsPanning(false)}
                        >
                          <img
                            src={getImageUrl(currentSlide.images[0])}
                            alt="Naval Unit Main"
                            className="max-w-full max-h-full object-contain"
                            style={{
                              display: 'block',
                              borderRadius: element.style?.borderRadius || 0,
                              transform: `
                                scale(${((element.style?.imageZoom || 100) / 100) * (viewZoom / 100)})
                                translate(${(element.style?.imageOffsetX || 0) + viewOffsetX}px, ${(element.style?.imageOffsetY || 0) + viewOffsetY}px)
                                rotate(${element.style?.imageRotation || 0}deg)
                              `,
                              transformOrigin: 'center center',
                              pointerEvents: 'none'
                            }}
                            onError={(e) => {
                              console.error('Error loading main image:', currentSlide.images[0]);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        // Gallery group slide - 2x2, 1x2, or single layout
                        <div
                          className={`w-full h-full grid gap-2 p-4 ${
                            currentSlide.images.length === 4 ? 'grid-cols-2 grid-rows-2' :
                            currentSlide.images.length === 2 ? 'grid-cols-2 grid-rows-1' :
                            'grid-cols-1'
                          }`}
                        >
                          {currentSlide.images.map((imgPath, imgIndex) => (
                            <div
                              key={imgIndex}
                              className="w-full h-full flex items-center justify-center bg-white rounded overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setFullscreenImage(imgPath);
                                setViewZoom(100);
                                setViewOffsetX(0);
                                setViewOffsetY(0);
                              }}
                            >
                              <img
                                src={getImageUrl(imgPath)}
                                alt={`Gallery ${imgIndex}`}
                                className="w-full h-full object-contain"
                                style={{
                                  borderRadius: element.style?.borderRadius || 0
                                }}
                                onError={(e) => {
                                  console.error('Error loading gallery image:', imgPath);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Zoom Controls - Only visible on main image slide */}
                      {currentSlide.type === 'main' && (
                        <div className="absolute top-2 right-2 z-50 bg-white bg-opacity-90 rounded-lg shadow-lg p-2 flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewZoom(prev => Math.min(prev + 25, 300));
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded p-2 transition-all"
                            title="Zoom In"
                          >
                            <ZoomIn className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewZoom(prev => Math.max(prev - 25, 50));
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded p-2 transition-all"
                            title="Zoom Out"
                          >
                            <ZoomOut className="h-5 w-5" />
                          </button>
                          <div className="text-center text-xs font-bold text-gray-700 px-1">
                            {viewZoom}%
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewZoom(100);
                              setViewOffsetX(0);
                              setViewOffsetY(0);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white rounded p-2 transition-all"
                            title="Reset View"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}

                      {/* Slide Counter */}
                      {hasMultipleSlides && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                          {currentSlideIndex + 1} / {totalSlides}
                        </div>
                      )}

                      {!mainImage && galleryImages.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-center text-sm font-bold">
                          SILHOUETTE NAVE
                        </div>
                      )}
                    </div>

                    {/* Navigation Buttons - Fixed at window edges */}
                    {hasMultipleSlides && (
                      <>
                        {/* Previous Button */}
                        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex((prev) =>
                                prev === 0 ? totalSlides - 1 : prev - 1
                              );
                              // Reset zoom/pan when changing slides
                              setViewZoom(100);
                              setViewOffsetX(0);
                              setViewOffsetY(0);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-all shadow-2xl hover:scale-110"
                            title="Diapositiva precedente"
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </button>
                        </div>

                        {/* Next Button */}
                        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex((prev) =>
                                prev === totalSlides - 1 ? 0 : prev + 1
                              );
                              // Reset zoom/pan when changing slides
                              setViewZoom(100);
                              setViewOffsetX(0);
                              setViewOffsetY(0);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-all shadow-2xl hover:scale-110"
                            title="Diapositiva successiva"
                          >
                            <ChevronRight className="h-8 w-8" />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {element.type === 'flag' && (
                <div className="w-full h-full flex items-center justify-center">
                  {element.image ? (
                    <img
                      src={getImageUrl(element.image)}
                      alt="Flag"
                      className="max-w-full max-h-full object-cover"
                      style={{
                        display: 'block',
                        borderRadius: element.style?.borderRadius || 0,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 6px 12px rgba(0, 0, 0, 0.2)',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))'
                      }}
                      onError={(e) => {
                        console.error('Error loading flag image:', element.image);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Flag image loaded successfully');
                      }}
                    />
                  ) : (
                    <div className="text-gray-600 text-center text-sm font-bold">BANDIERA</div>
                  )}
                </div>
              )}

              {element.type === 'table' && (
                <div className="w-full h-full bg-white border border-gray-400 overflow-auto">
                  <div className="p-2">
                    <div className="text-xs font-bold mb-2">CARATTERISTICHE</div>
                    <div className="text-xs">
                      <table className="w-full border-collapse">
                        <tbody>
                          {element.tableData?.map((row: string[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-b border-gray-300">
                              {row.map((cell: string, colIndex: number) => {
                                const columnWidths = element.style?.columnWidths || [];
                                const width = columnWidths[colIndex] ? `${columnWidths[colIndex]}%` : 'auto';
                                const headerBgColor = element.style?.headerBackgroundColor || '#f3f4f6';
                                const isHeader = rowIndex === 0;
                                
                                return (
                                  <td
                                    key={colIndex}
                                    className="p-1 border-r border-gray-300 text-left"
                                    style={{
                                      width: width,
                                      backgroundColor: isHeader ? headerBgColor : (rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff'),
                                      fontWeight: isHeader ? 'bold' : 'normal',
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Scheda non trovata</h1>
          <p className="text-gray-600">{error || 'La scheda richiesta non esiste'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{unit.name}</h1>
            <p className="text-gray-600 text-sm">Classe: {unit.unit_class}</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Condividi
            </button>
            <button
              onClick={handleExportPNG}
              className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              <FileImage className="h-3 w-3 mr-1" />
              PNG
            </button>
            <button
              onClick={handleExportPowerPoint}
              className="flex items-center px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            >
              <Presentation className="h-3 w-3 mr-1" />
              PowerPoint
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-1.5 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
            >
              <Printer className="h-3 w-3 mr-1" />
              Stampa
            </button>
          </div>
        </div>
      </div>

      {/* Canvas - Centered and taking full available space */}
      <div ref={containerRef} className="flex justify-center items-center p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="w-full flex justify-center">
          {renderCanvas()}
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-900">Scegli Template per PowerPoint</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {/* Current template option */}
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Template Attivo della Nave</h4>
                      <p className="text-sm text-gray-600">Usa il template attualmente applicato a questa nave</p>
                    </div>
                    <button
                      onClick={() => {
                        handleExportPowerPointWithTemplate(null);
                        setShowTemplateSelector(false);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Usa Questo
                    </button>
                  </div>
                </div>
                
                {/* Available templates */}
                {availableTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.canvasWidth}x{template.canvasHeight}px
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleExportPowerPointWithTemplate(template);
                          setShowTemplateSelector(false);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Usa Questo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center">
          <div
            className="w-full h-full flex items-center justify-center cursor-move relative"
            onMouseDown={(e) => {
              setIsPanning(true);
              setPanStart({ x: e.clientX - viewOffsetX, y: e.clientY - viewOffsetY });
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setViewOffsetX(e.clientX - panStart.x);
                setViewOffsetY(e.clientY - panStart.y);
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
          >
            <img
              src={getImageUrl(fullscreenImage)}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `
                  scale(${viewZoom / 100})
                  translate(${viewOffsetX}px, ${viewOffsetY}px)
                `,
                transformOrigin: 'center center',
                pointerEvents: 'none'
              }}
              onError={(e) => {
                console.error('Error loading fullscreen image:', fullscreenImage);
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Close Button */}
            <button
              onClick={() => {
                setFullscreenImage(null);
                setViewZoom(100);
                setViewOffsetX(0);
                setViewOffsetY(0);
              }}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 transition-all shadow-2xl hover:scale-110"
              title="Chiudi (ESC)"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-2 flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewZoom(prev => Math.min(prev + 25, 300));
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded p-2 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewZoom(prev => Math.max(prev - 25, 50));
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded p-2 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <div className="text-center text-xs font-bold text-gray-700 px-1">
                {viewZoom}%
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewZoom(100);
                  setViewOffsetX(0);
                  setViewOffsetY(0);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white rounded p-2 transition-all"
                title="Reset View"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}