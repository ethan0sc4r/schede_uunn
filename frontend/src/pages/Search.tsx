import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navalUnitsApi } from '../services/api';
import type { NavalUnit } from '../types/index.ts';
import NavalUnitCard from '../components/NavalUnitCard';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  });

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery, searchType],
    queryFn: () => navalUnitsApi.search(debouncedQuery, searchType),
    enabled: debouncedQuery.length >= 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Ricerca</h1>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Termine di ricerca
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Cerca unità navali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di ricerca
              </label>
              <select
                className="input-field"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="all">Tutto</option>
                <option value="name">Nome</option>
                <option value="class">Classe</option>
                <option value="nation">Nazione</option>
                <option value="characteristics">Caratteristiche</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
          >
            Cerca
          </button>
        </form>
      </div>

      {searchQuery.length < 2 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            Inserisci almeno 2 caratteri per iniziare la ricerca
          </div>
        </div>
      )}

      {searchQuery.length >= 2 && isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {searchQuery.length >= 2 && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Errore durante la ricerca
        </div>
      )}

      {searchResults && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Risultati della ricerca
            </h2>
            <p className="text-gray-600">
              {searchResults.total_count} unità trovate per "{debouncedQuery}"
            </p>
          </div>

          {searchResults.naval_units.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                Nessuna unità navale trovata
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.naval_units.map((unit) => (
                <NavalUnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}