import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Cache per le slide renderizzate
  const [slideCache, setSlideCache] = useState<Map<number, string>>(new Map());
  const [renderingQueue, setRenderingQueue] = useState<Set<number>>(new Set());
  const [isLoadingSlide, setIsLoadingSlide] = useState(false);
  
  // Stato per tenere traccia delle slide correnti
  const [currentSlideUrls, setCurrentSlideUrls] = useState<Map<number, string>>(new Map());
  const [slideErrors, setSlideErrors] = useState<Set<number>>(new Set());

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


  // Funzione per renderizzare una slide specifica
  const renderSlide = async (unitId: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
        const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/presentation/slide/${unitId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to render slide: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        resolve(imageUrl);
      } catch (error) {
        console.error(`Error rendering slide for unit ${unitId}:`, error);
        reject(error);
      }
    });
  };

  // Funzione per pre-renderizzare la prossima slide in modo asincrono
  const preRenderNextSlide = async (currentIdx: number) => {
    const nextIdx = (currentIdx + 1) % units.length;
    const nextUnitId = units[nextIdx]?.id;
    
    if (!nextUnitId || slideCache.has(nextUnitId) || renderingQueue.has(nextUnitId)) {
      return; // Già in cache o in rendering
    }
    
    // Aggiungi alla coda di rendering
    setRenderingQueue(prev => new Set(prev).add(nextUnitId));
    
    try {
      const imageUrl = await renderSlide(nextUnitId);
      
      // Salva nella cache
      setSlideCache(prev => {
        const newCache = new Map(prev);
        newCache.set(nextUnitId, imageUrl);
        return newCache;
      });
    } catch (error) {
      console.error(`Failed to pre-render slide for unit ${nextUnitId}:`, error);
    } finally {
      // Rimuovi dalla coda di rendering
      setRenderingQueue(prev => {
        const newQueue = new Set(prev);
        newQueue.delete(nextUnitId);
        return newQueue;
      });
    }
  };

  // Funzione per ottenere la slide corrente (dalla cache o renderizzarla)
  const getCurrentSlideUrl = async (unitId: number): Promise<string> => {
    // Controlla se è già in cache
    if (slideCache.has(unitId)) {
      return slideCache.get(unitId)!;
    }
    
    // Se non è in cache, renderizzala ora
    setIsLoadingSlide(true);
    
    try {
      const imageUrl = await renderSlide(unitId);
      
      // Salva nella cache
      setSlideCache(prev => {
        const newCache = new Map(prev);
        newCache.set(unitId, imageUrl);
        return newCache;
      });
      
      return imageUrl;
    } finally {
      setIsLoadingSlide(false);
    }
  };

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
  }, [isOpen, isFullscreen]);

  // Pre-render next slide when current slide is ready
  useEffect(() => {
    if (!isOpen || units.length === 0) return;

    const currentUnit = units[currentIndex];
    if (!currentUnit) return;

    // Pre-render next slide with delay
    const timer = setTimeout(() => {
      preRenderNextSlide(currentIndex);
    }, 1000); // Wait 1 second before pre-rendering next

    return () => clearTimeout(timer);
  }, [isOpen, currentIndex, units]);

  // Pre-render next slide when timer is about to expire
  useEffect(() => {
    if (!isPlaying || !isOpen || units.length === 0) return;

    // Pre-render next slide when 2 seconds remain
    if (timeRemaining === 2) {
      preRenderNextSlide(currentIndex);
    }
  }, [timeRemaining, isPlaying, isOpen, currentIndex, units.length]);

  // Handle closing
  const handleClose = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    }
    
    // Pulisci la cache quando chiudi la presentazione
    slideCache.forEach(url => URL.revokeObjectURL(url));
    currentSlideUrls.forEach(url => URL.revokeObjectURL(url));
    setSlideCache(new Map());
    setCurrentSlideUrls(new Map());
    setSlideErrors(new Set());
    setRenderingQueue(new Set());
    
    onClose();
  };

  // Cleanup della cache quando il componente viene smontato
  useEffect(() => {
    return () => {
      slideCache.forEach(url => URL.revokeObjectURL(url));
      currentSlideUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Cleanup quando la presentazione viene chiusa (non durante il loop)
  useEffect(() => {
    if (!isOpen) {
      // Pulisci la cache solo quando la presentazione viene effettivamente chiusa
      slideCache.forEach(url => URL.revokeObjectURL(url));
      currentSlideUrls.forEach(url => URL.revokeObjectURL(url));
      setSlideCache(new Map());
      setCurrentSlideUrls(new Map());
      setSlideErrors(new Set());
      setRenderingQueue(new Set());
    }
  }, [isOpen]);

  // Get current units to display
  const getCurrentUnits = useCallback(() => {
    if (config.mode === 'single') {
      return units.slice(currentIndex, currentIndex + 1);
    } else {
      const startIndex = currentPage * unitsPerPage;
      return units.slice(startIndex, startIndex + unitsPerPage);
    }
  }, [config.mode, currentIndex, currentPage, units, unitsPerPage]);


  // Show controls on mouse movement and keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = () => {
      setShowControls(true);
      
      // Clear existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Auto-hide controls after 1 second
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      setShowControls(true);
      
      // Clear existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Auto-hide controls after 1 second
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
      
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
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    // Add event listeners to the document
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    
    // Start with controls visible and set initial timeout
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
    
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Timer logic - più stabile
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Auto advance
          if (config.mode === 'single') {
            setCurrentIndex(prevIndex => (prevIndex + 1) % units.length);
          } else {
            setCurrentPage(prevPage => (prevPage + 1) % totalPages);
          }
          // Reset timer for next slide
          const durationSeconds = config.mode === 'single' 
            ? (config.interval || 5)
            : (config.page_duration || 10);
          return durationSeconds;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isOpen]);

  // Reset timer when slide changes manually
  useEffect(() => {
    if (isPlaying && isOpen) {
      const durationSeconds = config.mode === 'single' 
        ? (config.interval || 5)
        : (config.page_duration || 10);
      setTimeRemaining(durationSeconds);
    }
  }, [currentIndex, currentPage, config.mode, config.interval, config.page_duration, isPlaying, isOpen]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleNext = () => {
    if (config.mode === 'single') {
      setCurrentIndex(prev => (prev + 1) % units.length);
    } else {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }
    // Reset timer
    const duration = config.mode === 'single' ? (config.interval || 5) : (config.page_duration || 10);
    setTimeRemaining(duration);
  };

  const handlePrevious = () => {
    if (config.mode === 'single') {
      setCurrentIndex(prev => (prev - 1 + units.length) % units.length);
    } else {
      setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    }
    // Reset timer
    const duration = config.mode === 'single' ? (config.interval || 5) : (config.page_duration || 10);
    setTimeRemaining(duration);
  };

  // Trigger slide loading when needed
  useEffect(() => {
    const currentUnit = units[currentIndex];
    if (!currentUnit || !isOpen) return;

    const unitId = currentUnit.id;
    const cachedSlideUrl = slideCache.get(unitId);
    const currentSlideUrl = currentSlideUrls.get(unitId);
    const hasError = slideErrors.has(unitId);
    const inQueue = renderingQueue.has(unitId);

    if (!cachedSlideUrl && !currentSlideUrl && !inQueue && !hasError) {
      getCurrentSlideUrl(unitId).then((url) => {
        setCurrentSlideUrls(prev => {
          const newMap = new Map(prev);
          newMap.set(unitId, url);
          return newMap;
        });
        setSlideErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(unitId);
          return newSet;
        });
      }).catch((error) => {
        console.error(`Error loading current slide for unit ${unitId}:`, error);
        setSlideErrors(prev => new Set(prev).add(unitId));
      });
    } else if (cachedSlideUrl && !currentSlideUrl) {
      setCurrentSlideUrls(prev => {
        const newMap = new Map(prev);
        newMap.set(unitId, cachedSlideUrl);
        return newMap;
      });
      setSlideErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(unitId);
        return newSet;
      });
    }
  }, [currentIndex, isOpen, units]);

  const renderUnit = (unit: NavalUnit) => {
    const cachedSlideUrl = slideCache.get(unit.id);
    const currentSlideUrl = currentSlideUrls.get(unit.id);
    const hasError = slideErrors.has(unit.id);
    const displayUrl = currentSlideUrl || cachedSlideUrl;

    // Show loading state while slide is being rendered
    if (!displayUrl && !hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="bg-white bg-opacity-10 p-8 rounded-lg backdrop-blur-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">{unit.name}</h1>
            <h2 className="text-lg text-gray-300 mb-4">{unit.unit_class}</h2>
            <p className="text-gray-400">Rendering slide...</p>
          </div>
        </div>
      );
    }

    // Show error state if slide failed to load
    if (hasError || !displayUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{unit.name}</h1>
            <h2 className="text-xl text-gray-600 mb-8">{unit.unit_class}</h2>
            <p className="text-red-500">Errore nel caricamento della slide</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <img
          src={displayUrl}
          alt={`${unit.name} - ${unit.unit_class}`}
          className="w-full h-full object-contain"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100%',
            height: '100%'
          }}
          onError={(e) => {
            console.error('Error displaying slide for unit:', unit.name);
            setSlideErrors(prev => new Set(prev).add(unit.id));
          }}
          onLoad={() => {
            // Slide loaded successfully
          }}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  const currentUnits = getCurrentUnits();

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Floating Header Controls */}
      <div className={`absolute top-4 left-4 right-4 z-10 flex items-center justify-between transition-all duration-500 ease-in-out ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
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
      <div className={`absolute bottom-4 left-4 right-4 z-10 transition-all duration-500 ease-in-out ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
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