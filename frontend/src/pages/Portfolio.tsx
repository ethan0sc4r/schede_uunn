import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { portfolioApi } from '../services/api';

interface Template {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: string;
  creator?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface NavalUnit {
  id: number;
  name: string;
  unit_class: string;
  nation: string;
}

interface PortfolioUnit {
  id: number;
  naval_unit_id: number;
  template_id: string;
  custom_name?: string;
  element_states: any;
  canvas_config: any;
  notes?: string;
  name: string;           // nome originale unità
  unit_class: string;
  nation: string;
  logo_path?: string;
  silhouette_path?: string;
  flag_path?: string;
  template_name: string;
  template_description: string;
  created_at: string;
  updated_at: string;
}

const Portfolio: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    setToken(authToken);
  }, []);
  
  const [portfolioUnits, setPortfolioUnits] = useState<PortfolioUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<PortfolioUnit[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [navalUnits, setNavalUnits] = useState<NavalUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'my-portfolio' | 'browse-templates' | 'my-templates'>('my-portfolio');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUseTemplate, setShowUseTemplate] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [selectedPortfolioUnits, setSelectedPortfolioUnits] = useState<number[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    if (token) {
      loadPortfolio();
      loadNavalUnits();
      if (activeTab === 'browse-templates') {
        loadPublicTemplates();
      } else if (activeTab === 'my-templates') {
        loadUserTemplates();
      }
    }
  }, [token, activeTab]);

  // Ricarica portfolio quando cambia la ricerca (server-side search)
  useEffect(() => {
    if (token && activeTab === 'my-portfolio') {
      loadPortfolio();
    }
  }, [searchQuery]);

  useEffect(() => {
    // Non serve più filtraggio client-side, la ricerca è server-side
    setFilteredUnits(portfolioUnits);
  }, [portfolioUnits]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await portfolioApi.getUserPortfolio(searchQuery || undefined);
      setPortfolioUnits(data.portfolio_units);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicTemplates = async () => {
    try {
      const response = await fetch('/api/templates/public', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPublicTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading public templates:', error);
    }
  };

  const loadUserTemplates = async () => {
    try {
      const response = await fetch('/api/templates/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading user templates:', error);
    }
  };

  const loadNavalUnits = async () => {
    try {
      const response = await fetch('/api/units', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const units = await response.json();
        setNavalUnits(units);
      }
    } catch (error) {
      console.error('Error loading naval units:', error);
    }
  };

  // Portfolio creation function - currently not used
  // const createPortfolio = async () => {
  //   // Commented out - using single portfolio per user system
  // };

  const loadPortfolioDetails = async (portfolioId: number) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const portfolio = await response.json();
        // setSelectedPortfolio(portfolio); // Commented out
      }
    } catch (error) {
      console.error('Error loading portfolio details:', error);
    }
  };

  const toggleTemplateVisibility = async (templateId: string, currentVisibility: boolean) => {
    try {
      console.log('Toggling template visibility:', templateId, 'from', currentVisibility, 'to', !currentVisibility);
      
      const newVisibility = !currentVisibility;
      const response = await fetch(`/api/templates/${templateId}/visibility?is_public=${newVisibility}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Toggle response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Template visibility updated:', result);
        loadUserTemplates();
      } else {
        const errorData = await response.json();
        console.error('Error updating template visibility:', errorData);
        console.log('Full error details:', errorData.detail);
        alert(`Errore: ${JSON.stringify(errorData.detail)}`);
      }
    } catch (error) {
      console.error('Error updating template visibility:', error);
      alert('Errore di connessione');
    }
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedUnits([]);
    setShowUseTemplate(true);
  };

  const applyTemplateToUnits = async () => {
    if (!selectedTemplate || selectedUnits.length === 0) {
      alert('Seleziona almeno un\'unità navale');
      return;
    }

    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          unit_ids: selectedUnits
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowUseTemplate(false);
        setSelectedTemplate(null);
        setSelectedUnits([]);
        loadPortfolio();
      } else {
        const errorData = await response.json();
        console.error('Error applying template:', errorData);
        alert(`Errore: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Errore di connessione');
    }
  };

  const handleExportUnit = async (unit: PortfolioUnit) => {
    try {
      const response = await fetch(`/api/units/${unit.naval_unit_id}/export/powerpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: unit.template_id,
          customizations: {
            element_states: unit.element_states,
            canvas_config: unit.canvas_config
          }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${unit.custom_name || unit.name}_${unit.template_name}.pptx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Errore durante l\'esportazione');
      }
    } catch (error) {
      console.error('Error exporting unit:', error);
      alert('Errore di connessione');
    }
  };

  const handleRemoveFromPortfolio = async (unitId: number, templateId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questa unità dal portfolio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolio/${unitId}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Unità rimossa dal portfolio');
        loadPortfolio();
      } else {
        const errorData = await response.json();
        console.error('Error removing unit from portfolio:', errorData);
        alert(`Errore: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error removing unit from portfolio:', error);
      alert('Errore di connessione');
    }
  };

  const createGroupFromPortfolio = async () => {
    if (!newGroupName.trim() || selectedPortfolioUnits.length === 0) {
      alert('Inserisci un nome per il gruppo e seleziona almeno un\'unità');
      return;
    }

    try {
      const response = await fetch('/api/portfolio/create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          portfolio_unit_ids: selectedPortfolioUnits
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDescription('');
        setSelectedPortfolioUnits([]);
      } else {
        const errorData = await response.json();
        console.error('Error creating group:', errorData);
        alert(`Errore: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Errore di connessione');
    }
  };

  const renderMyPortfolio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Il Mio Portfolio</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Crea Gruppo
          </button>
        </div>
      </div>

      {/* Barra di ricerca */}
      <div className="bg-white p-4 border rounded-lg shadow">
        <input
          type="text"
          placeholder="Cerca nel portfolio (nome, classe, nazione, template, note...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-md"
        />
      </div>

      {/* Statistiche */}
      <div className="bg-white p-4 border rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{portfolioUnits.length}</div>
            <div className="text-sm text-gray-600">Unità Totali</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{filteredUnits.length}</div>
            <div className="text-sm text-gray-600">Unità Filtrate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(portfolioUnits.map(u => u.template_id)).size}
            </div>
            <div className="text-sm text-gray-600">Template Usati</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {selectedPortfolioUnits.length}
            </div>
            <div className="text-sm text-gray-600">Selezionate</div>
          </div>
        </div>
      </div>

      {/* Lista unità portfolio */}
      <div className="space-y-4">
        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <div key={unit.id} className="bg-white p-4 border rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-lg">{unit.custom_name || unit.name}</h5>
                  <input
                    type="checkbox"
                    checked={selectedPortfolioUnits.includes(unit.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPortfolioUnits([...selectedPortfolioUnits, unit.id]);
                      } else {
                        setSelectedPortfolioUnits(selectedPortfolioUnits.filter(id => id !== unit.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                </div>
                
                {unit.custom_name && (
                  <p className="text-sm text-gray-500 mb-1">Originale: {unit.name}</p>
                )}
                <p className="text-sm text-gray-600">Classe: {unit.unit_class}</p>
                <p className="text-sm text-gray-600">Nazione: {unit.nation}</p>
                <p className="text-sm text-blue-600 mb-2">Template: {unit.template_name}</p>
                
                {unit.notes && (
                  <p className="text-xs text-gray-500 mb-3 italic">{unit.notes}</p>
                )}
                
                <div className="flex gap-1">
                  <button
                    onClick={() => window.open(`/units/${unit.naval_unit_id}/view?template=${unit.template_id}&portfolio=true`, '_blank')}
                    className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
                  >
                    Visualizza
                  </button>
                  <button
                    onClick={() => handleExportUnit(unit)}
                    className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700"
                  >
                    Esporta
                  </button>
                  <button
                    onClick={() => handleRemoveFromPortfolio(unit.naval_unit_id, unit.template_id)}
                    className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700"
                  >
                    Rimuovi
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  Aggiornato: {new Date(unit.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'Nessuna unità trovata con questi criteri' : 'Il tuo portfolio è vuoto'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Prova a modificare la ricerca' : 'Vai su "Sfoglia Template" per aggiungere unità al portfolio'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderBrowseTemplates = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sfoglia Template Pubblici</h2>
      <p className="text-gray-600">
        Esplora i template creati da altri utenti e utilizzali per i tuoi portfolio
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {publicTemplates.map((template) => (
          <div key={template.id} className="bg-white p-4 border rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              {template.isDefault && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-3">{template.description}</p>
            
            {template.creator && (
              <div className="text-xs text-gray-500 mb-3">
                <p>Creato da: {template.creator.first_name} {template.creator.last_name}</p>
                <p>{new Date(template.createdAt).toLocaleDateString()}</p>
              </div>
            )}
            
            <button 
              onClick={() => handleUseTemplate(template)}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Usa Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyTemplates = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">I Miei Template</h2>
      <p className="text-gray-600">
        Gestisci i tuoi template personali e la loro visibilità
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userTemplates.map((template) => (
          <div key={template.id} className="bg-white p-4 border rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <div className="flex gap-1">
                {template.isDefault && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Default
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  template.isPublic 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.isPublic ? 'Pubblico' : 'Privato'}
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{template.description}</p>
            <p className="text-xs text-gray-500 mb-3">
              Creato il: {new Date(template.createdAt).toLocaleDateString()}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => toggleTemplateVisibility(template.id, template.isPublic)}
                className={`flex-1 py-2 rounded-md text-sm ${
                  template.isPublic
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={template.isDefault}
              >
                {template.isPublic ? 'Rendi Privato' : 'Rendi Pubblico'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Portfolio</h1>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('my-portfolio')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'my-portfolio'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            I Miei Portfolio
          </button>
          <button
            onClick={() => setActiveTab('browse-templates')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'browse-templates'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sfoglia Template
          </button>
          <button
            onClick={() => setActiveTab('my-templates')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'my-templates'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            I Miei Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'my-portfolio' && renderMyPortfolio()}
          {activeTab === 'browse-templates' && renderBrowseTemplates()}
          {activeTab === 'my-templates' && renderMyTemplates()}
        </div>
      )}

      {/* Modal per applicare template a unità multiple */}
      {showUseTemplate && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Applica Template: {selectedTemplate.name}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Seleziona le unità navali a cui applicare questo template. Le unità verranno aggiunte al tuo portfolio con questo template.
            </p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {navalUnits.map((unit) => (
                <label key={unit.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUnits.includes(unit.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUnits([...selectedUnits, unit.id]);
                      } else {
                        setSelectedUnits(selectedUnits.filter(id => id !== unit.id));
                      }
                    }}
                    className="w-4 h-4 mr-3"
                  />
                  <div>
                    <div className="font-medium">{unit.name}</div>
                    <div className="text-sm text-gray-600">{unit.unit_class} - {unit.nation}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={applyTemplateToUnits}
                disabled={selectedUnits.length === 0}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Applica a {selectedUnits.length} unità
              </button>
              <button
                onClick={() => {
                  setShowUseTemplate(false);
                  setSelectedTemplate(null);
                  setSelectedUnits([]);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal per creare gruppo da portfolio */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Crea Gruppo da Portfolio
            </h3>
            
            <p className="text-gray-600 mb-4">
              Hai selezionato {selectedPortfolioUnits.length} unità dal portfolio.
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome gruppo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full p-3 border rounded-md"
              />
              <textarea
                placeholder="Descrizione (opzionale)"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full p-3 border rounded-md"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={createGroupFromPortfolio}
                disabled={!newGroupName.trim() || selectedPortfolioUnits.length === 0}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Crea Gruppo
              </button>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;