/**
 * Identification Storage Utility
 * Manages autocomplete dictionary for ship identification elements
 */

const STORAGE_KEY = 'naval_elements_dictionary';

export interface ElementDictionary {
  [element: string]: number; // element name -> usage count
}

export interface IdentificationElement {
  id: string;
  element: string;
}

export interface NavalData {
  type: 'naval_data';
  version: string;
  freeNotes?: string;
  identification?: IdentificationElement[];
}

/**
 * Get the elements dictionary from localStorage
 */
export const getElementsDictionary = (): ElementDictionary => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading elements dictionary:', error);
  }
  return {};
};

/**
 * Save the elements dictionary to localStorage
 */
export const saveElementsDictionary = (dictionary: ElementDictionary): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
  } catch (error) {
    console.error('Error saving elements dictionary:', error);
  }
};

/**
 * Add an element to the dictionary (increment usage count)
 */
export const addElementToDictionary = (element: string): void => {
  const dictionary = getElementsDictionary();
  const trimmedElement = element.trim();

  if (trimmedElement) {
    dictionary[trimmedElement] = (dictionary[trimmedElement] || 0) + 1;
    saveElementsDictionary(dictionary);
  }
};

/**
 * Get autocomplete suggestions based on input
 */
export const getAutocompleteSuggestions = (input: string, limit: number = 10): Array<{ element: string; count: number }> => {
  const dictionary = getElementsDictionary();
  const normalizedInput = input.toLowerCase().trim();

  if (!normalizedInput) {
    // Return most used elements if no input
    return Object.entries(dictionary)
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Filter and sort by relevance and usage count
  return Object.entries(dictionary)
    .filter(([element]) => element.toLowerCase().includes(normalizedInput))
    .map(([element, count]) => ({ element, count }))
    .sort((a, b) => {
      // Exact match first
      const aExact = a.element.toLowerCase() === normalizedInput;
      const bExact = b.element.toLowerCase() === normalizedInput;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Starts with match second
      const aStarts = a.element.toLowerCase().startsWith(normalizedInput);
      const bStarts = b.element.toLowerCase().startsWith(normalizedInput);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then by usage count
      return b.count - a.count;
    })
    .slice(0, limit);
};

/**
 * Parse notes field to extract identification data
 */
export const parseNotesField = (notes: string | null | undefined): NavalData => {
  if (!notes) {
    return {
      type: 'naval_data',
      version: '1.0',
      freeNotes: '',
      identification: []
    };
  }

  try {
    const parsed = JSON.parse(notes);

    // Check if it's already in the new format
    if (parsed.type === 'naval_data') {
      return {
        ...parsed,
        identification: parsed.identification || []
      };
    }

    // Migrate old HTML notes format
    return {
      type: 'naval_data',
      version: '1.0',
      freeNotes: notes,
      identification: []
    };
  } catch (error) {
    // Not JSON, treat as HTML notes
    return {
      type: 'naval_data',
      version: '1.0',
      freeNotes: notes,
      identification: []
    };
  }
};

/**
 * Serialize naval data back to string for storage
 * Note: Identification elements are ordered from bow to stern (prora → poppa)
 */
export const serializeNavalData = (data: NavalData): string => {
  return JSON.stringify(data);
};

/**
 * Build dictionary from all units (for initialization)
 */
export const buildDictionaryFromUnits = (units: any[]): void => {
  const dictionary: ElementDictionary = {};

  units.forEach(unit => {
    if (unit.notes) {
      const navalData = parseNotesField(unit.notes);
      if (navalData.identification) {
        navalData.identification.forEach(item => {
          const element = item.element.trim();
          if (element) {
            dictionary[element] = (dictionary[element] || 0) + 1;
          }
        });
      }
    }
  });

  saveElementsDictionary(dictionary);
};

/**
 * Generate unique ID for identification element
 */
export const generateElementId = (): string => {
  return `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
