import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Clock, User, Target, TrendingUp } from 'lucide-react';

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

type QuizStatisticsType = {
  total_sessions: number;
  average_score: number;
  quiz_type_distribution: { [key: string]: number };
  score_distribution: { [key: string]: number };
};

const QUIZ_TYPE_NAMES = {
  'name_to_class': 'Nome → Classe',
  'nation_to_class': 'Nazione → Classe',
  'class_to_flag': 'Classe → Bandiera'
};

export default function QuizHistory() {
  const [history, setHistory] = useState<QuizSessionType[]>([]);
  const [statistics, setStatistics] = useState<QuizStatisticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load quiz history
      const historyResponse = await fetch('/api/quiz/history');
      if (!historyResponse.ok) {
        throw new Error('Errore nel caricamento dello storico');
      }
      const historyData = await historyResponse.json();
      setHistory(historyData.history || []);

      // Load statistics
      const statsResponse = await fetch('/api/quiz/stats');
      if (!statsResponse.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }
      const statsData = await statsResponse.json();
      setStatistics(statsData);

    } catch (error: any) {
      console.error('Error loading quiz data:', error);
      setError(error.message || 'Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const filteredHistory = history.filter(session => {
    if (selectedFilter === 'all') return true;
    return session.quiz_type === selectedFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 29) return 'text-green-600 bg-green-100';
    if (score >= 26) return 'text-blue-600 bg-blue-100';
    if (score >= 22) return 'text-yellow-600 bg-yellow-100';
    if (score >= 18) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeText = (score: number) => {
    if (score >= 29) return 'Eccellente';
    if (score >= 26) return 'Molto Buono';
    if (score >= 22) return 'Buono';
    if (score >= 18) return 'Sufficiente';
    return 'Insufficiente';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (session: QuizSessionType) => {
    const startedAt = new Date(session.started_at);
    const completedAt = new Date(session.completed_at);
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const durationMin = Math.floor(durationMs / 60000);
    
    if (durationMin > 0) {
      return `${durationMin}m`;
    }
    return `${Math.floor(durationMs / 1000)}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento storico quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Errore</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={handleBackToHome}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Storico Quiz</h1>
              <p className="text-gray-600 text-sm">Cronologia e statistiche dei quiz completati</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Quiz Completati</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_sessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Punteggio Medio</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.average_score.toFixed(1)}/30</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Quiz Superati</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(statistics.score_distribution['18-21'] || 0) + 
                     (statistics.score_distribution['22-25'] || 0) + 
                     (statistics.score_distribution['26-28'] || 0) + 
                     (statistics.score_distribution['29-30'] || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo Più Frequente</p>
                  <p className="text-sm font-bold text-gray-900">
                    {Object.keys(statistics.quiz_type_distribution).length > 0 ? 
                      QUIZ_TYPE_NAMES[Object.keys(statistics.quiz_type_distribution).reduce((a, b) => 
                        statistics.quiz_type_distribution[a] > statistics.quiz_type_distribution[b] ? a : b
                      ) as keyof typeof QUIZ_TYPE_NAMES] : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Distribution Chart */}
        {statistics && Object.keys(statistics.score_distribution).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Punteggi</h3>
            <div className="space-y-3">
              {Object.entries(statistics.score_distribution).map(([range, count]) => {
                const percentage = statistics.total_sessions > 0 ? (count / statistics.total_sessions) * 100 : 0;
                const color = range === '29-30' ? 'bg-green-500' : 
                             range === '26-28' ? 'bg-blue-500' : 
                             range === '22-25' ? 'bg-yellow-500' : 
                             range === '18-21' ? 'bg-orange-500' : 'bg-red-500';
                
                return (
                  <div key={range} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{range}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${color} transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti ({history.length})
            </button>
            {Object.entries(QUIZ_TYPE_NAMES).map(([type, name]) => {
              const count = history.filter(s => s.quiz_type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiz History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun quiz completato</h3>
            <p className="text-gray-600 mb-6">Completa il tuo primo quiz per vedere i risultati qui.</p>
            <Link
              to="/quiz"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Inizia Primo Quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {session.participant_name} {session.participant_surname}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {QUIZ_TYPE_NAMES[session.quiz_type as keyof typeof QUIZ_TYPE_NAMES]}
                          </p>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(session.score)}`}>
                          {session.score}/30 - {getGradeText(session.score)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(session.completed_at)}
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatDuration(session)}
                        </div>
                        
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          {session.correct_answers}/{session.total_questions} corrette
                        </div>
                        
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {Math.round((session.correct_answers / session.total_questions) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Quiz Button */}
        <div className="mt-8 text-center">
          <Link
            to="/quiz"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Nuovo Quiz
          </Link>
        </div>
      </div>
    </div>
  );
}