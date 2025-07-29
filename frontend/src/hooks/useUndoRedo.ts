import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  state: T;
  timestamp: number;
  description?: string;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export const useUndoRedo = <T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) => {
  const { maxHistorySize = 50, debounceMs = 500 } = options;
  
  const [history, setHistory] = useState<HistoryState<T>[]>([
    { state: initialState, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const lastSaveTime = useRef(Date.now());

  // Get current state
  const currentState = history[currentIndex]?.state ?? initialState;

  // Check if we can undo/redo
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Save state to history
  const saveState = useCallback((
    newState: T, 
    description?: string, 
    force: boolean = false
  ) => {
    const now = Date.now();
    
    // Debounce rapid changes unless forced
    if (!force && debounceMs > 0) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        saveStateImmediate(newState, description, now);
      }, debounceMs);
      
      return;
    }
    
    saveStateImmediate(newState, description, now);
  }, [debounceMs]);

  const saveStateImmediate = useCallback((
    newState: T, 
    description?: string, 
    timestamp: number
  ) => {
    setHistory(prevHistory => {
      // Remove any history after current index (we're creating a new branch)
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({
        state: newState,
        timestamp,
        description
      });
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(prev => Math.max(0, prev - 1));
        return newHistory;
      }
      
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
    
    lastSaveTime.current = timestamp;
  }, [currentIndex, maxHistorySize]);

  // Undo operation
  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
      
      // Clear any pending debounced saves
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    }
  }, [canUndo]);

  // Redo operation
  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
      
      // Clear any pending debounced saves
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    }
  }, [canRedo]);

  // Go to specific history index
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
      
      // Clear any pending debounced saves
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    }
  }, [history.length]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([{ state: currentState, timestamp: Date.now() }]);
    setCurrentIndex(0);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
  }, [currentState]);

  // Get history info
  const getHistoryInfo = useCallback(() => {
    return {
      total: history.length,
      current: currentIndex,
      canUndo,
      canRedo,
      history: history.map((item, index) => ({
        index,
        timestamp: item.timestamp,
        description: item.description,
        isCurrent: index === currentIndex
      }))
    };
  }, [history, currentIndex, canUndo, canRedo]);

  return {
    // Current state
    state: currentState,
    
    // Actions
    saveState,
    undo,
    redo,
    goToIndex,
    clearHistory,
    
    // Status
    canUndo,
    canRedo,
    
    // Info
    getHistoryInfo
  };
};