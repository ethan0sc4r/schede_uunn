import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, FileImage, Printer } from 'lucide-react';
import { navalUnitsApi } from '../services/api';
import { exportCanvasToPNG, printCanvas } from '../utils/exportUtils';
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
    if (!unit?.layout_config?.elements) return null;

    return (
      <div className="relative bg-white shadow-xl rounded-lg overflow-visible">
        <div 
          ref={canvasRef}
          data-export-target="true"
          className="block"
          style={{ 
            width: 1123, 
            height: 794,
            backgroundColor: unit.layout_config.canvasBackground || '#ffffff',
            borderWidth: unit.layout_config.canvasBorderWidth || 4,
            borderColor: unit.layout_config.canvasBorderColor || '#000000',
            borderStyle: 'solid',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          {unit.layout_config.elements.map((element: any) => (
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
                      src={element.image}
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
                      src={element.image}
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