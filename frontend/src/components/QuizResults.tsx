import { CheckCircle, XCircle, Trophy, Clock, Target, User } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Types defined inline to avoid import issues
type QuizSessionType = {
  id: number;
  participant_name: string;
  participant_surname: string;
  quiz_type: string;
  total_questions: number;
  time_per_question: number;
  correct_answers: number;
  score: number;
  status: string;
  started_at: string;
  completed_at: string;
};

const QUIZ_TYPE_NAMES = {
  'name_to_class': 'Nome → Classe',
  'nation_to_class': 'Nazione → Classe',
  'class_to_flag': 'Classe → Bandiera'
};

interface QuizResultsProps {
  session: QuizSessionType;
  onNewQuiz: () => void;
  onViewHistory: () => void;
}

export default function QuizResults({ session, onNewQuiz, onViewHistory }: QuizResultsProps) {
  const { success, error: showError, warning, info } = useToast();
  const percentage = Math.round((session.correct_answers / session.total_questions) * 100);
  const isPassing = session.score >= 18;
  
  const getScoreColor = () => {
    if (session.score >= 29) return 'text-green-600';
    if (session.score >= 26) return 'text-blue-600';
    if (session.score >= 22) return 'text-yellow-600';
    if (session.score >= 18) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (session.score >= 29) return 'bg-green-100 border-green-300';
    if (session.score >= 26) return 'bg-blue-100 border-blue-300';
    if (session.score >= 22) return 'bg-yellow-100 border-yellow-300';
    if (session.score >= 18) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  const getGradeText = () => {
    if (session.score >= 29) return 'Eccellente';
    if (session.score >= 26) return 'Molto Buono';
    if (session.score >= 22) return 'Buono';
    if (session.score >= 18) return 'Sufficiente';
    return 'Insufficiente';
  };

  const formatDuration = () => {
    const startedAt = new Date(session.started_at);
    const completedAt = new Date(session.completed_at);
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    
    if (durationMin > 0) {
      return `${durationMin}m ${durationSec}s`;
    }
    return `${durationSec}s`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-4">
          {isPassing ? (
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
          ) : (
            <Target className="h-16 w-16 text-gray-400 mx-auto" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quiz Completato!
        </h1>
        
        <p className="text-gray-600">
          {session.participant_name} {session.participant_surname}
        </p>
      </div>

      {/* Score Card */}
      <div className={`rounded-lg border-2 p-6 mb-6 ${getScoreBgColor()}`}>
        <div className="text-center">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
            {session.score}/30
          </div>
          
          <div className={`text-xl font-semibold mb-2 ${getScoreColor()}`}>
            {getGradeText()}
          </div>
          
          <div className="text-gray-700">
            {session.correct_answers} risposte corrette su {session.total_questions} ({percentage}%)
          </div>
        </div>
      </div>

      {/* Quiz Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Target className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Tipo Quiz</span>
          </div>
          <p className="text-gray-700">
            {QUIZ_TYPE_NAMES[session.quiz_type as keyof typeof QUIZ_TYPE_NAMES]}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Durata</span>
          </div>
          <p className="text-gray-700">{formatDuration()}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-gray-900">Risposte Corrette</span>
          </div>
          <p className="text-gray-700">
            {session.correct_answers} ({percentage}%)
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-medium text-gray-900">Risposte Sbagliate</span>
          </div>
          <p className="text-gray-700">
            {session.total_questions - session.correct_answers} ({100 - percentage}%)
          </p>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Analisi Performance</h3>
        <div className="text-sm text-blue-800">
          {session.score >= 29 && (
            <p>🎉 Risultato eccellente! Hai una conoscenza approfondita delle unità navali.</p>
          )}
          {session.score >= 26 && session.score < 29 && (
            <p>👍 Molto bene! Hai dimostrato una buona conoscenza delle unità navali.</p>
          )}
          {session.score >= 22 && session.score < 26 && (
            <p>✅ Buon risultato! Continua a studiare per migliorare ulteriormente.</p>
          )}
          {session.score >= 18 && session.score < 22 && (
            <p>📚 Sufficiente. Ti consigliamo di rivedere le caratteristiche delle unità navali.</p>
          )}
          {session.score < 18 && (
            <p>📖 Risultato insufficiente. È necessario approfondire lo studio delle unità navali.</p>
          )}
          
          <div className="mt-2">
            <strong>Tempo medio per domanda:</strong> {Math.round((session.time_per_question * session.total_questions) / session.total_questions)} secondi
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso Quiz</span>
          <span>{session.correct_answers}/{session.total_questions}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              percentage >= 60 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Quiz Completion Certificate */}
      {isPassing && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6 mb-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Certificato di Completamento
            </h3>
            <p className="text-yellow-800 text-sm">
              Hai superato con successo il quiz di riconoscimento unità navali
              <br />
              <strong>{QUIZ_TYPE_NAMES[session.quiz_type as keyof typeof QUIZ_TYPE_NAMES]}</strong>
              <br />
              con il punteggio di <strong>{session.score}/30</strong>
            </p>
            <div className="mt-3 text-xs text-yellow-700">
              Completato il {new Date(session.completed_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNewQuiz}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Nuovo Quiz
        </button>
        
        <button
          onClick={onViewHistory}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Storico Quiz
        </button>
      </div>

      {/* Share Results */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            const text = `Ho completato un quiz di riconoscimento unità navali con il punteggio di ${session.score}/30! 🚢`;
            if (navigator.share) {
              navigator.share({
                title: 'Risultato Quiz Navale',
                text: text
              });
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(text);
              success('Risultato copiato negli appunti!');
            }
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          🔗 Condividi Risultato
        </button>
      </div>
    </div>
  );
}