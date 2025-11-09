import { useState, useEffect, useRef } from 'react';
import { Clock, ZoomIn, ZoomOut, RotateCcw, CheckCircle, XCircle, Images } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import GalleryViewer from './GalleryViewer';
import type { GalleryImage } from '../types/index.ts';
import { navalUnitsApi } from '../services/api';

// Types defined inline to avoid import issues
type QuizQuestionDataType = {
  id: number;
  session_id: number;
  question_number: number;
  question_type: string;
  naval_unit_id: number;
  name: string;
  unit_class: string;
  nation: string | null;
  silhouette_path: string | null;
  flag_path: string | null;
  layout_config: any;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
};

type AnswerFeedbackType = {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
};

interface QuizQuestionProps {
  question: QuizQuestionDataType;
  questionNumber: number;
  totalQuestions: number;
  timePerQuestion: number;
  onAnswerSubmit: (answer: string) => void;
  onTimeUp: () => void;
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  timePerQuestion,
  onAnswerSubmit,
  onTimeUp
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(timePerQuestion);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedbackType | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, imageX: 0, imageY: 0 });
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [unitDetails, setUnitDetails] = useState<any>(null);

  const imageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAnswered, onTimeUp]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setIsAnswered(false);
    setFeedback(null);
    setTimeRemaining(timePerQuestion);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [question.id, timePerQuestion]);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || isAnswered) return;

    setIsAnswered(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      const authToken = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/quiz/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          session_id: question.session_id,
          question_number: question.question_number,
          user_answer: selectedAnswer
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFeedback({
          isCorrect: result.is_correct,
          correctAnswer: result.correct_answer,
          userAnswer: selectedAnswer
        });

        // Always fetch unit details for all quiz types
        try {
          // Fetch full unit details using API client
          const unitData = await navalUnitsApi.getById(question.naval_unit_id);
          setUnitDetails(unitData);
          setGallery(unitData.gallery || []);
        } catch (error) {
          console.error('Error fetching unit details:', error);
        }

        // Don't auto-advance - user will click button to continue
      } else {
        console.error('Error submitting answer');
        onAnswerSubmit(selectedAnswer); // Continue anyway
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      onAnswerSubmit(selectedAnswer); // Continue anyway
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      imageX: imagePosition.x,
      imageY: imagePosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setImagePosition({
      x: dragStart.imageX + deltaX,
      y: dragStart.imageY + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getSilhouetteImage = () => {
    if (question.silhouette_path) {
      return getImageUrl(question.silhouette_path);
    }
    
    // Try to get from layout_config
    if (question.layout_config?.elements) {
      const silhouetteElement = question.layout_config.elements.find((el: any) => el.type === 'silhouette');
      if (silhouetteElement?.image) {
        return getImageUrl(silhouetteElement.image);
      }
    }
    
    return null;
  };

  const getFlagImage = () => {
    if (question.flag_path) {
      return getImageUrl(question.flag_path);
    }
    
    // Try to get from layout_config
    if (question.layout_config?.elements) {
      const flagElement = question.layout_config.elements.find((el: any) => el.type === 'flag');
      if (flagElement?.image) {
        return getImageUrl(flagElement.image);
      }
    }
    
    return null;
  };

  const getQuestionText = () => {
    switch (question.question_type) {
      case 'name_to_class':
        return `Quale è la classe dell'unità navale "${question.name}"?`;
      case 'nation_to_class':
        return `Quale è la classe di questa unità navale della ${question.nation}?`;
      case 'class_to_flag':
        return `Quale bandiera appartiene alla classe "${question.unit_class}"?`;
      case 'silhouette_to_class':
        return `Quale è la classe di questa unità navale?`;
      default:
        return 'Domanda quiz';
    }
  };

  const options = [
    { key: 'A', value: question.option_a },
    { key: 'B', value: question.option_b },
    { key: 'C', value: question.option_c },
    { key: 'D', value: question.option_d }
  ];

  const silhouetteImage = getSilhouetteImage();
  const flagImage = getFlagImage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 10) return 'text-red-600';
    if (timeRemaining <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Domanda {questionNumber} di {totalQuestions}
          </h2>
          <p className="text-gray-600 mt-2 text-lg">{getQuestionText()}</p>
        </div>

        <div className={`flex items-center text-3xl font-mono ${getTimerColor()}`}>
          <Clock className="h-8 w-8 mr-2" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Silhouette Section - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-4 h-full">
            <h3 className="font-semibold text-gray-900 mb-3 text-lg">Silhouette</h3>
            <div className="relative bg-white rounded border-2 border-gray-200 overflow-hidden">
              {silhouetteImage ? (
                <div
                  ref={imageRef}
                  className="relative h-[400px] cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={silhouetteImage}
                    alt="Naval unit silhouette"
                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                      cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🚢</div>
                    <div className="text-sm">Silhouette non disponibile</div>
                  </div>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Additional Info based on quiz type */}
            <div className="mt-3">
              {question.question_type === 'name_to_class' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">Nome Unità</h4>
                  <p className="text-blue-800 text-base font-semibold">{question.name}</p>
                </div>
              )}

              {question.question_type === 'nation_to_class' && question.nation && (
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-medium text-green-900 mb-1 text-sm">Nazione</h4>
                  <p className="text-green-800 text-base font-semibold">{question.nation}</p>
                </div>
              )}

              {question.question_type === 'class_to_flag' && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <h4 className="font-medium text-purple-900 mb-1 text-sm">Classe</h4>
                  <p className="text-purple-800 text-base font-semibold">{question.unit_class}</p>
                  {flagImage && (
                    <div className="mt-2">
                      <div className="w-12 h-9 border border-gray-300 rounded overflow-hidden">
                        <img
                          src={flagImage}
                          alt="Unit flag"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Answer Section - 1/3 width */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-gray-50 rounded-lg p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 text-base mb-4 text-center">Seleziona la risposta:</h3>

            <div className="flex-1 flex flex-col gap-3">
              {options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => !isAnswered && setSelectedAnswer(option.value)}
                  disabled={isAnswered}
                  className={`p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3 ${
                    selectedAnswer === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${isAnswered ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-base flex-shrink-0 ${
                    selectedAnswer === option.value
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}>
                    {option.key}
                  </div>
                  <span className="text-gray-900 text-base font-medium flex-1">{option.value}</span>
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer || isAnswered}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isAnswered ? 'Risposta Inviata' : 'Conferma Risposta'}
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-lg p-6 w-full mx-4 max-h-[90vh] overflow-y-auto ${
            unitDetails ? 'max-w-5xl' : 'max-w-md'
          }`}>
            <div>
              {/* Feedback Header - Compact */}
              <div className="flex items-start gap-4 mb-4">
                {feedback.isCorrect ? (
                  <CheckCircle className="h-12 w-12 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    feedback.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feedback.isCorrect ? 'Corretto!' : 'Sbagliato!'}
                  </h3>
                  <div className="space-y-1 text-gray-700 text-sm">
                    <p><strong>La tua risposta:</strong> {feedback.userAnswer}</p>
                    {!feedback.isCorrect && (
                      <p><strong>Risposta corretta:</strong> {feedback.correctAnswer}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Unit Details Card - Compact */}
              {unitDetails && (
                <div className={`rounded-lg p-4 mb-4 ${
                  feedback.isCorrect ? 'bg-green-50 border border-green-500' : 'bg-red-50 border border-red-500'
                }`}>
                  <h4 className={`font-bold mb-3 text-lg ${
                    feedback.isCorrect ? 'text-green-900' : 'text-red-900'
                  }`}>Scheda Completa</h4>
                  <div className="space-y-3">
                    {/* Info Section - Compact */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Nome: </span>
                        <span className="text-gray-900 font-semibold">{unitDetails.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Classe: </span>
                        <span className="text-gray-900 font-semibold">{unitDetails.unit_class}</span>
                      </div>
                      {unitDetails.nation && (
                        <div>
                          <span className="font-medium text-gray-600">Nazione: </span>
                          <span className="text-gray-900 font-semibold">{unitDetails.nation}</span>
                        </div>
                      )}
                    </div>

                    {/* Characteristics - Compact */}
                    {unitDetails.characteristics && unitDetails.characteristics.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Caratteristiche:</span>
                        <div className="space-y-0.5">
                          {unitDetails.characteristics.slice(0, 3).map((char: any) => (
                            <div key={char.id} className="text-xs">
                              <span className="text-gray-600 font-medium">{char.characteristic_name}: </span>
                              <span className="text-gray-900">{char.characteristic_value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Silhouette - Compact */}
                    {unitDetails.silhouette_path && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Silhouette:</span>
                        <img
                          src={getImageUrl(unitDetails.silhouette_path)}
                          alt="Silhouette"
                          className="w-full h-[250px] object-contain bg-white rounded border"
                        />
                      </div>
                    )}

                    {/* Gallery Button - Compact */}
                    {gallery.length > 0 && (
                      <button
                        onClick={() => setShowGallery(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        <Images className="h-4 w-4" />
                        Visualizza Galleria ({gallery.length} foto)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={() => onAnswerSubmit(selectedAnswer)}
                className="w-full max-w-md mx-auto block px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 transition-colors shadow-lg"
              >
                Prossima Domanda →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Viewer */}
      {showGallery && gallery.length > 0 && (
        <GalleryViewer
          images={gallery}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}