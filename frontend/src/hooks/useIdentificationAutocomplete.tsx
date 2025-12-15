import { useState, useEffect, useCallback } from 'react';
import { getAutocompleteSuggestions } from '../utils/identificationStorage';

interface AutocompleteSuggestion {
  element: string;
  count: number;
}

export const useIdentificationAutocomplete = (input: string, enabled: boolean = true) => {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Debounce autocomplete
    const timeoutId = setTimeout(() => {
      const results = getAutocompleteSuggestions(input, 10);
      setSuggestions(results);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [input, enabled]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    clearSuggestions
  };
};
