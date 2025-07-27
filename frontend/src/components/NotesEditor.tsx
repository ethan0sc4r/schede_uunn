import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Type, Save, X } from 'lucide-react';

interface NotesEditorProps {
  unit: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}

export default function NotesEditor({ unit, isOpen, onClose, onSave }: NotesEditorProps) {
  const [content, setContent] = useState(unit?.notes || '');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && editorRef.current && unit?.notes !== undefined) {
      editorRef.current.innerHTML = unit.notes || '';
      setContent(unit.notes || '');
    }
  }, [isOpen, unit?.notes]);

  if (!isOpen) return null;

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleCommand = (command: string, value?: string) => {
    const range = saveSelection();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setTimeout(() => restoreSelection(range), 0);
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    const htmlContent = editorRef.current?.innerHTML || '';
    onSave(htmlContent);
    onClose();
  };

  const handleTextColorChange = (color: string) => {
    handleCommand('foreColor', color);
  };

  const handleFontSizeChange = (size: string) => {
    handleCommand('fontSize', size);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Note per {unit?.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Classe: {unit?.unit_class}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Text Formatting */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => handleCommand('bold')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Grassetto"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCommand('italic')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Corsivo"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCommand('underline')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Sottolineato"
              >
                <Underline className="h-4 w-4" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => handleCommand('justifyLeft')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Allinea a sinistra"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCommand('justifyCenter')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Allinea al centro"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCommand('justifyRight')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Allinea a destra"
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => handleCommand('insertUnorderedList')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Elenco puntato"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCommand('insertOrderedList')}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Elenco numerato"
              >
                <Type className="h-4 w-4" />
              </button>
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-2">
              <label className="text-sm text-gray-600">Dimensione:</label>
              <select
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="1">Piccolo</option>
                <option value="3" selected>Normale</option>
                <option value="4">Grande</option>
                <option value="5">Molto Grande</option>
              </select>
            </div>

            {/* Text Color */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Colore:</label>
              <input
                type="color"
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Colore testo"
              />
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={editorRef}
            contentEditable
            className="w-full h-full min-h-[400px] border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ lineHeight: '1.6' }}
            onInput={handleInput}
            suppressContentEditableWarning={true}
            data-placeholder="Inserisci le tue note qui..."
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Usa la barra degli strumenti per formattare il testo. Le note verranno salvate automaticamente.
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salva Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}