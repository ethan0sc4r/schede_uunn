import QuizTemplatesManager from '../components/QuizTemplatesManager';

export default function QuizTemplates() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quiz Templates</h1>
          <p className="mt-2 text-gray-600">
            Crea e gestisci template di quiz con link pubblici condivisibili
          </p>
        </div>
        <QuizTemplatesManager />
      </div>
    </div>
  );
}
