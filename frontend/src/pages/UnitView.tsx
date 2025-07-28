import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, FileImage, Printer, Presentation } from 'lucide-react';
import { navalUnitsApi } from '../services/api';
import { exportCanvasToPNG, printCanvas } from '../utils/exportUtils';
import { getImageUrl } from '../utils/imageUtils';
import type { NavalUnit } from '../types/index.ts';

export default function UnitView() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<NavalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUnit = async () => {
      if (!id) return;
      
      try {
        const unitData = await navalUnitsApi.getById(parseInt(id));
        setUnit(unitData);
      } catch (err) {
        setError('Errore nel caricamento della scheda');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUnit();
  }, [id]);

  const handlePrint = async () => {
    if (!unit || !canvasRef.current) {
      alert('Errore: Canvas non disponibile per la stampa');
      return;
    }
    
    console.log('Starting print for:', unit.name);
    console.log('Canvas ref element:', canvasRef.current);
    
    try {
      await printCanvas(canvasRef.current);
      console.log('Print initiated successfully');
    } catch (error: any) {
      console.error('Print error:', error);
      alert(`Errore durante la stampa: ${error.message || error}`);
    }
  };

  const handleExportPNG = async () => {
    if (!unit || !canvasRef.current) {
      alert('Errore: Canvas non disponibile per l\'esportazione');
      return;
    }
    
    console.log('Starting PNG export for:', unit.name);
    console.log('Canvas ref element:', canvasRef.current);
    console.log('Canvas dimensions:', canvasRef.current.offsetWidth, 'x', canvasRef.current.offsetHeight);
    
    try {
      const filename = `${unit.name.replace(/\s+/g, '_')}_scheda.png`;
      await exportCanvasToPNG(canvasRef.current, filename);
      console.log('PNG export completed successfully');
    } catch (error: any) {
      console.error('PNG export error:', error);
      alert(`Errore durante l'esportazione PNG: ${error.message || error}`);
    }
  };

  const handleExportPowerPoint = async () => {
    if (!unit) {
      alert('Errore: Unità non disponibile per l\'esportazione');
      return;
    }
    
    console.log('Starting PowerPoint export for unit:', unit.id);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      
      console.log('🔍 PowerPoint export starting from View:', {
        unitId: unit.id,
        apiUrl: `${API_BASE_URL}/api/units/${unit.id}/export/powerpoint`
      });
      
      const response = await fetch(`${API_BASE_URL}/api/units/${unit.id}/export/powerpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty template config for default export
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PowerPoint export error response:', response.status, errorText);
        
        if (response.status === 401) {
          alert('Sessione scaduta. Ricarica la pagina e rieffettua il login.');
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
      alert(`PowerPoint di "${unit.name}" esportato con successo!`);
    } catch (error: any) {
      console.error('PowerPoint export error:', error);
      alert(`Errore durante l'esportazione PowerPoint: ${error.message || error}`);
    }
  };

  const handleShare = async () => {
    if (!unit) return;
    const shareUrl = window.location.href;
    const shareMessage = `Nave ${unit.name} classe ${unit.unit_class} è stato copiato in memoria`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(shareMessage);
    } catch (error) {
      console.error('Errore copia link:', error);
      alert('Errore durante la copia del link');
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
      
      if (unit.silhouette_path) {
        basicElements.push({
          id: 'silhouette',
          type: 'silhouette',
          x: 20,
          y: 180,
          width: 1083,
          height: 300,
          image: unit.silhouette_path,
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

              {(element.type === 'logo' || element.type === 'silhouette') && (
                <div className="w-full h-full flex items-center justify-center">
                  {element.image ? (
                    <img
                      src={getImageUrl(element.image)}
                      alt={element.type}
                      className="max-w-full max-h-full object-contain"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        console.error('Error loading image:', element.image);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', element.type);
                      }}
                    />
                  ) : (
                    <div className="text-gray-600 text-center text-sm font-bold">
                      {element.type === 'logo' && 'LOGO'}
                      {element.type === 'silhouette' && 'SILHOUETTE NAVE'}
                    </div>
                  )}
                </div>
              )}

              {element.type === 'flag' && (
                <div className="w-full h-full flex items-center justify-center">
                  {element.image ? (
                    <img
                      src={getImageUrl(element.image)}
                      alt="Flag"
                      className="max-w-full max-h-full object-cover"
                      style={{ display: 'block' }}
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
                      {element.tableData?.map((row: string[], rowIndex: number) => (
                        <div key={rowIndex} className="flex border-b border-gray-300">
                          {row.map((cell: string, colIndex: number) => {
                            const isHeader = rowIndex === 0;
                            const bgColor = colIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white';
                            
                            return (
                              <div
                                key={colIndex}
                                className={`flex-1 p-2 border-r border-gray-300 ${bgColor} ${isHeader ? 'font-medium' : ''}`}
                              >
                                <span>{cell}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
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
    </div>
  );
}