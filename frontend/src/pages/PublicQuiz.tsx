import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizTemplatesApi } from '../services/api';
import type { QuizTemplate } from '../services/api';
import { Ship, Clock, HelpCircle, Loader } from 'lucide-react';

export default function PublicQuiz() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<QuizTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [participantSurname, setParticipantSurname] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token non valido');
      setLoading(false);
      return;
    }

    loadTemplate();
  }, [token]);

  const loadTemplate = async () => {
    try {
      const data = await quizTemplatesApi.getPublic(token!);
      setTemplate(data);
    } catch (err: any) {
      console.error('Error loading template:', err);
      setError('Quiz template non trovato o non più disponibile');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantName.trim() || !participantSurname.trim()) {
      alert('Inserisci nome e cognome');
      return;
    }

    setIsStarting(true);
    try {
      const result = await quizTemplatesApi.startPublic(token!, participantName, participantSurname);

      // Navigate to quiz with session ID
      navigate(`/quiz`, {
        state: {
          fromPublicTemplate: true,
          sessionId: result.session_id
        }
      });
    } catch (err: any) {
      console.error('Error starting quiz:', err);
      alert('Errore nell\'avvio del quiz. Riprova.');
    } finally {
      setIsStarting(false);
    }
  };

  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'name_to_class': return 'Nome → Classe';
      case 'nation_to_class': return 'Nazione → Classe';
      case 'class_to_flag': return 'Classe → Bandiera';
      case 'silhouette_to_class': return 'Silhouette → Classe';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <HelpCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Quiz Non Trovato</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Ship className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
          {template.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
        </div>

        {/* Quiz Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Quiz</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Tipo</div>
                <div className="font-semibold text-gray-900">{getQuizTypeLabel(template.quiz_type)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Domande</div>
                <div className="font-semibold text-gray-900">{template.total_questions}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Tempo per domanda</div>
                <div className="font-semibold text-gray-900">{template.time_per_question}s</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ship className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Unità navali</div>
                <div className="font-semibold text-gray-900">{template.selected_unit_ids.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Form */}
        <form onSubmit={handleStartQuiz} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci il tuo nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cognome *
            </label>
            <input
              type="text"
              value={participantSurname}
              onChange={(e) => setParticipantSurname(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Inserisci il tuo cognome"
            />
          </div>

          <button
            type="submit"
            disabled={isStarting}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                Avvio in corso...
              </span>
            ) : (
              'Inizia Quiz'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Completando questo quiz accetti di condividere nome e cognome con l'organizzatore
        </p>
      </div>
    </div>
  );
}
