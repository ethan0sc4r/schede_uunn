import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import QuizConfiguration from '../components/QuizConfiguration';
import QuizQuestion from '../components/QuizQuestion';
import QuizResults from '../components/QuizResults';

// Types defined inline to avoid import issues
type QuizState = 'configuration' | 'in_progress' | 'completed';

type QuizConfigType = {
  participantName: string;
  participantSurname: string;
  quizType: 'name_to_class' | 'nation_to_class' | 'class_to_flag' | 'silhouette_to_class';
  totalQuestions: number;
  timePerQuestion: number;
};

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

export default function Quiz() {
  const [quizState, setQuizState] = useState<QuizState>('configuration');
  const [currentSession, setCurrentSession] = useState<QuizSessionType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestionDataType | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartQuiz = async (config: QuizConfigType) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create quiz session
      const response = await fetch('/api/quiz/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name: config.participantName,
          participant_surname: config.participantSurname,
          quiz_type: config.quizType,
          total_questions: config.totalQuestions,
          time_per_question: config.timePerQuestion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Errore nella creazione del quiz');
      }

      const data = await response.json();
      setCurrentSession(data.session);

      // Load first question
      await loadQuestion(data.session_id, 1);
      
      setQuizState('in_progress');
      setCurrentQuestionNumber(1);
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      setError(error.message || 'Errore nel avviare il quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestion = async (sessionId: number, questionNumber: number) => {
    try {
      const response = await fetch(`/api/quiz/session/${sessionId}/question/${questionNumber}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento della domanda');
      }

      const questionData = await response.json();
      setCurrentQuestion(questionData);
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Errore nel caricamento della domanda');
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (!currentSession || !currentQuestion) return;

    // Move to next question or complete quiz
    if (currentQuestionNumber < currentSession.total_questions) {
      const nextQuestionNumber = currentQuestionNumber + 1;
      setCurrentQuestionNumber(nextQuestionNumber);
      await loadQuestion(currentSession.id, nextQuestionNumber);
    } else {
      // Complete the quiz
      await completeQuiz();
    }
  };

  const handleTimeUp = async () => {
    if (!currentSession) return;

    // Submit empty answer for timeout
    try {
      await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSession.id,
          question_number: currentQuestionNumber,
          user_answer: '' // Empty answer for timeout
        })
      });
    } catch (error) {
      console.error('Error submitting timeout answer:', error);
    }

    // Move to next question or complete quiz
    if (currentQuestionNumber < currentSession.total_questions) {
      const nextQuestionNumber = currentQuestionNumber + 1;
      setCurrentQuestionNumber(nextQuestionNumber);
      await loadQuestion(currentSession.id, nextQuestionNumber);
    } else {
      await completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/quiz/session/${currentSession.id}/complete`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Errore nel completamento del quiz');
      }

      const completedSession = await response.json();
      setCurrentSession(completedSession);
      setQuizState('completed');
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('Errore nel completamento del quiz');
    }
  };

  const handleNewQuiz = () => {
    setQuizState('configuration');
    setCurrentSession(null);
    setCurrentQuestion(null);
    setCurrentQuestionNumber(1);
    setError(null);
  };

  const handleViewHistory = () => {
    // Navigate to quiz history page
    window.location.href = '/quiz/history';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparazione quiz in corso...</p>
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
                onClick={handleNewQuiz}
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
            <div className="flex items-center">
              <button
                onClick={handleBackToHome}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Torna alla home"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quiz Unità Navali</h1>
                <p className="text-gray-600 text-sm">Sistema di riconoscimento e valutazione</p>
              </div>
            </div>
            
            {quizState === 'in_progress' && currentSession && (
              <div className="text-right text-sm text-gray-600">
                <div>
                  <strong>{currentSession.participant_name} {currentSession.participant_surname}</strong>
                </div>
                <div>
                  Domanda {currentQuestionNumber} di {currentSession.total_questions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {quizState === 'configuration' && (
          <QuizConfiguration
            onStartQuiz={handleStartQuiz}
            onCancel={handleBackToHome}
          />
        )}

        {quizState === 'in_progress' && currentQuestion && currentSession && (
          <QuizQuestion
            question={currentQuestion}
            questionNumber={currentQuestionNumber}
            totalQuestions={currentSession.total_questions}
            timePerQuestion={currentSession.time_per_question}
            onAnswerSubmit={handleAnswerSubmit}
            onTimeUp={handleTimeUp}
          />
        )}

        {quizState === 'completed' && currentSession && (
          <QuizResults
            session={currentSession}
            onNewQuiz={handleNewQuiz}
            onViewHistory={handleViewHistory}
          />
        )}
      </div>
    </div>
  );
}