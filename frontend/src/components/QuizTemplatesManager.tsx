import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Copy, Trash2, ExternalLink } from 'lucide-react';
import { quizTemplatesApi } from '../services/api';
import type { QuizTemplate } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import QuizNavalUnitSelector from './QuizNavalUnitSelector';

export default function QuizTemplatesManager() {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const { success, error: showError } = useToast();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    quiz_type: 'silhouette_to_class',
    selected_unit_ids: [] as number[],
    total_questions: 10,
    time_per_question: 60,
    allow_duplicates: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await quizTemplatesApi.getAll();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      showError('Errore nel caricamento dei template');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      showError('Inserisci un nome per il template');
      return;
    }

    if (newTemplate.selected_unit_ids.length < 4) {
      showError('Seleziona almeno 4 unità navali');
      return;
    }

    try {
      const result = await quizTemplatesApi.create(newTemplate);
      success(`Template "${newTemplate.name}" creato con successo!`);

      // Copy public URL to clipboard
      const fullUrl = `${window.location.origin}${result.public_url}`;
      await navigator.clipboard.writeText(fullUrl);
      success('Link pubblico copiato negli appunti!');

      setShowCreateModal(false);
      setNewTemplate({
        name: '',
        description: '',
        quiz_type: 'silhouette_to_class',
        selected_unit_ids: [],
        total_questions: 10,
        time_per_question: 60,
        allow_duplicates: false,
      });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Errore nella creazione del template');
    }
  };

  const handleDelete = async (templateId: number, templateName: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il template "${templateName}"?`)) {
      return;
    }

    try {
      await quizTemplatesApi.delete(templateId);
      success('Template eliminato con successo');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Errore durante l\'eliminazione del template');
    }
  };

  const copyPublicLink = async (template: QuizTemplate) => {
    const fullUrl = `${window.location.origin}${template.public_url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      success('Link pubblico copiato negli appunti!');
    } catch (error) {
      showError('Errore nella copia del link');
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
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Quiz Templates</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuovo Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <LinkIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Nessun quiz template creato.</p>
          <p className="text-sm mt-1">Crea un template per generare link pubblici condivisibili.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {getQuizTypeLabel(template.quiz_type)}
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                      {template.total_questions} domande
                    </span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      {template.time_per_question}s per domanda
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {template.selected_unit_ids.length} unità
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${template.public_url}`}
                      className="flex-1 px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyPublicLink(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Copia link pubblico"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(template.public_url, '_blank')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Apri link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id!, template.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && !showUnitSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nuovo Quiz Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Template *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Es: Quiz Navi Russe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Descrizione opzionale..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo di Quiz *
                </label>
                <select
                  value={newTemplate.quiz_type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, quiz_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="silhouette_to_class">Silhouette → Classe</option>
                  <option value="name_to_class">Nome → Classe</option>
                  <option value="nation_to_class">Nazione → Classe</option>
                  <option value="class_to_flag">Classe → Bandiera</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero Domande *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTemplate.total_questions}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_questions: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo per Domanda (secondi) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={newTemplate.time_per_question}
                    onChange={(e) => setNewTemplate({ ...newTemplate, time_per_question: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_duplicates"
                  checked={newTemplate.allow_duplicates}
                  onChange={(e) => setNewTemplate({ ...newTemplate, allow_duplicates: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="allow_duplicates" className="text-sm text-gray-700">
                  Consenti unità duplicate nelle domande
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unità Navali Selezionate *
                </label>
                <button
                  onClick={() => setShowUnitSelector(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-gray-600"
                >
                  {newTemplate.selected_unit_ids.length === 0
                    ? 'Seleziona Unità Navali (minimo 4)'
                    : `${newTemplate.selected_unit_ids.length} unità selezionate`
                  }
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({
                    name: '',
                    description: '',
                    quiz_type: 'silhouette_to_class',
                    selected_unit_ids: [],
                    total_questions: 10,
                    time_per_question: 60,
                    allow_duplicates: false,
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crea Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Selector Modal */}
      {showUnitSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Seleziona Unità Navali</h3>
            <QuizNavalUnitSelector
              selectedUnitIds={newTemplate.selected_unit_ids}
              onSelectionChange={(unitIds: number[]) => {
                setNewTemplate({ ...newTemplate, selected_unit_ids: unitIds });
              }}
              onNext={() => setShowUnitSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
