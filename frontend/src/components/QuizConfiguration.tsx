import { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';

// Types defined inline to avoid import issues
type QuizConfigType = {
  participantName: string;
  participantSurname: string;
  quizType: 'name_to_class' | 'nation_to_class' | 'class_to_flag' | 'silhouette_to_class';
  totalQuestions: number;
  timePerQuestion: number;
  allowDuplicates: boolean;
};

interface QuizConfigurationProps {
  selectedUnitsCount: number;
  onStartQuiz: (config: QuizConfigType) => void;
  onCancel: () => void;
  onBack: () => void;
}

const QUIZ_TYPES = [
  {
    id: 'name_to_class' as const,
    title: 'Nome → Classe',
    description: 'Visualizzi la silhouette e il nome, devi indovinare la classe'
  },
  {
    id: 'nation_to_class' as const,
    title: 'Nazione → Classe',
    description: 'Visualizzi la silhouette e la nazione, devi riconoscere la classe'
  },
  {
    id: 'class_to_flag' as const,
    title: 'Classe → Bandiera',
    description: 'Visualizzi la silhouette e la classe, devi riconoscere la bandiera'
  },
  {
    id: 'silhouette_to_class' as const,
    title: 'Silhouette → Classe',
    description: 'Visualizzi solo la silhouette, devi indovinare la classe'
  }
];

export default function QuizConfiguration({ selectedUnitsCount, onStartQuiz, onCancel, onBack }: QuizConfigurationProps) {
  const [participantName, setParticipantName] = useState('');
  const [participantSurname, setParticipantSurname] = useState('');
  const [selectedQuizType, setSelectedQuizType] = useState<QuizConfigType['quizType']>('name_to_class');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // No need to check available units - we already have selected units

  const validateConfiguration = (): string[] => {
    const errors: string[] = [];

    if (!participantName.trim()) {
      errors.push('Il nome è obbligatorio');
    }

    if (!participantSurname.trim()) {
      errors.push('Il cognome è obbligatorio');
    }

    if (totalQuestions < 1) {
      errors.push('Deve esserci almeno 1 domanda');
    }

    if (totalQuestions > 50) {
      errors.push('Non puoi avere più di 50 domande');
    }

    if (timePerQuestion < 10) {
      errors.push('Il tempo per domanda deve essere almeno 10 secondi');
    }

    if (timePerQuestion > 300) {
      errors.push('Il tempo per domanda non può superare 5 minuti');
    }

    // NEW: Validate against selected units
    if (selectedUnitsCount < 4) {
      errors.push(`Hai selezionato solo ${selectedUnitsCount} navi. Minimo richiesto: 4`);
    }

    // NEW: If duplicates are NOT allowed, questions can't exceed selected units
    if (!allowDuplicates && totalQuestions > selectedUnitsCount) {
      errors.push(`Hai selezionato ${selectedUnitsCount} navi ma chiedi ${totalQuestions} domande. Abilita le ripetizioni o riduci a max ${selectedUnitsCount} domande.`);
    }

    return errors;
  };

  const handleStartQuiz = () => {
    const validationErrors = validateConfiguration();
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      onStartQuiz({
        participantName: participantName.trim(),
        participantSurname: participantSurname.trim(),
        quizType: selectedQuizType,
        totalQuestions,
        timePerQuestion,
        allowDuplicates
      });
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Configurazione Quiz</h2>
          <p className="text-gray-600 mt-1">Configura il tuo quiz di riconoscimento unità navali</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Participant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Informazioni Partecipante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Inserisci il tuo nome"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome *
                </label>
                <input
                  type="text"
                  value={participantSurname}
                  onChange={(e) => setParticipantSurname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Inserisci il tuo cognome"
                />
              </div>
            </div>
          </div>

          {/* Quiz Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tipo di Quiz</h3>

            <div className="space-y-3">
              {QUIZ_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedQuizType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuizType(type.id)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={selectedQuizType === type.id}
                      onChange={() => setSelectedQuizType(type.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Parametri Quiz
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero di Domande
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {allowDuplicates
                    ? `Nessun limite (ripetizioni abilitate)`
                    : `Massimo: ${selectedUnitsCount} (navi selezionate)`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo per Domanda (secondi)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimo: 10 secondi, Massimo: 5 minuti
                </p>
              </div>
            </div>

            {/* Allow Duplicates Toggle */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Consenti domande ripetute</span>
                  <p className="text-xs text-gray-600 mt-0.5">
                    La stessa nave può apparire più volte durante il quiz
                  </p>
                </span>
              </label>
            </div>
          </div>

          {/* Quiz Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Riepilogo Quiz</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Partecipante: {participantName} {participantSurname}</p>
              <p>Tipo: {QUIZ_TYPES.find(t => t.id === selectedQuizType)?.title}</p>
              <p>Domande: {totalQuestions}</p>
              <p>Tempo per domanda: {timePerQuestion} secondi</p>
              <p>Durata totale: {Math.ceil((totalQuestions * timePerQuestion) / 60)} minuti circa</p>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Errori di Configurazione
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            ← Indietro
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleStartQuiz}
              disabled={errors.length > 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Avvia Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}