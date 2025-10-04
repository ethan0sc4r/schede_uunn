# Canvas Editor - Refactored Module

## Overview

Modulo completo per l'editing canvas di unità navali, completamente refactorato in componenti riutilizzabili e custom hooks.

## Struttura

```
CanvasEditor/
├── hooks/               # Custom hooks per logica business
│   ├── useCanvasState.ts
│   ├── useElementOperations.ts
│   ├── useImageUpload.ts
│   └── useTemplateManager.ts
├── components/          # Componenti UI
│   ├── CanvasToolbar.tsx
│   ├── ElementsPanel.tsx
│   ├── PropertiesPanel.tsx
│   ├── CanvasWorkspace.tsx
│   └── CanvasElement.tsx
└── utils/               # Utilities, constants, types
    ├── canvasConstants.ts
    ├── canvasTypes.ts
    └── elementHelpers.ts
```

## Usage Example

### Basic Implementation

```typescript
import { useState } from 'react';
import {
  useCanvasState,
  useElementOperations,
  useImageUpload,
  useTemplateManager,
  CanvasToolbar,
  ElementsPanel,
  PropertiesPanel,
  CanvasWorkspace,
} from './components/CanvasEditor';
import { useUndoRedo } from './hooks/useUndoRedo';
import type { NavalUnit } from './types';

interface MyEditorProps {
  unit?: NavalUnit;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function MyCanvasEditor({ unit, onSave, onCancel }: MyEditorProps) {
  // 1. Canvas State Management
  const canvasState = useCanvasState({ unit });

  // 2. Element Operations
  const elementOps = useElementOperations({
    elements: canvasState.elements,
    setElements: canvasState.setElements,
    setSelectedElement: canvasState.setSelectedElement,
  });

  // 3. Image Upload
  const imageUpload = useImageUpload();

  // 4. Template Management
  const templateManager = useTemplateManager({
    unitId: unit?.id,
    currentTemplateId: unit?.current_template_id,
  });

  // 5. Undo/Redo (existing hook)
  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(
    canvasState.elements,
    canvasState.setElements
  );

  // Flag selector modal state
  const [showFlagSelector, setShowFlagSelector] = useState(false);

  // Save handler
  const handleSave = () => {
    const canvasData = {
      ...canvasState.getCanvasState(),
      current_template_id: templateManager.currentTemplateId,
    };
    onSave(canvasData);
  };

  // Template selection handler
  const handleTemplateSelect = (template: Template, formatOnly: boolean) => {
    const result = templateManager.applyTemplate(
      template,
      canvasState.elements,
      formatOnly
    );

    canvasState.setElements(result.elements);
    if (result.canvasWidth) canvasState.setCanvasWidth(result.canvasWidth);
    if (result.canvasHeight) canvasState.setCanvasHeight(result.canvasHeight);
    if (result.canvasBackground) canvasState.setCanvasBackground(result.canvasBackground);
  };

  // Image upload handlers
  const handleUploadLogo = async (file: File) => {
    const path = await imageUpload.uploadLogo(file);
    if (path && canvasState.selectedElement) {
      elementOps.updateElement(canvasState.selectedElement, { image: path });
    }
  };

  // ... similar for uploadFlag, uploadSilhouette, uploadGeneral

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <CanvasToolbar
        onSave={handleSave}
        onCancel={onCancel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        currentTemplateId={templateManager.currentTemplateId}
        onTemplateSelect={handleTemplateSelect}
        unitName={unit?.name}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Add Elements */}
        <ElementsPanel
          onAddElement={elementOps.addElement}
          onUploadLogo={handleUploadLogo}
          onUploadFlag={async (file) => {
            const path = await imageUpload.uploadFlag(file);
            if (path) elementOps.addElement('flag', 200, 50, { image: path });
          }}
          onUploadSilhouette={async (file) => {
            const path = await imageUpload.uploadSilhouette(file);
            if (path) elementOps.addElement('silhouette', 100, 300, { image: path });
          }}
          onUploadGeneral={async (file) => {
            const path = await imageUpload.uploadGeneral(file);
            // Handle general image
          }}
          onSelectPredefinedFlag={() => setShowFlagSelector(true)}
          onImportTemplate={(template) => handleTemplateSelect(template, false)}
          isUploading={imageUpload.isUploading}
        />

        {/* Center - Canvas */}
        <CanvasWorkspace
          elements={canvasState.elements}
          selectedElementId={canvasState.selectedElement}
          onElementSelect={canvasState.setSelectedElement}
          canvasWidth={canvasState.canvasWidth}
          canvasHeight={canvasState.canvasHeight}
          canvasBackground={canvasState.canvasBackground}
          canvasBorderWidth={canvasState.canvasBorderWidth}
          canvasBorderColor={canvasState.canvasBorderColor}
          onElementMove={(id, x, y) => elementOps.updateElement(id, { x, y })}
          onElementResize={(id, width, height, x, y) =>
            elementOps.updateElement(id, { width, height, x, y })
          }
          zoomLevel={canvasState.zoomLevel}
        />

        {/* Right Panel - Properties */}
        <PropertiesPanel
          selectedElement={
            canvasState.selectedElement
              ? elementOps.getElementById(canvasState.selectedElement)
              : null
          }
          onElementUpdate={(updates) => {
            if (canvasState.selectedElement) {
              elementOps.updateElement(canvasState.selectedElement, updates);
            }
          }}
          onElementDelete={() => {
            if (canvasState.selectedElement) {
              elementOps.deleteElement(canvasState.selectedElement);
            }
          }}
          onElementDuplicate={() => {
            if (canvasState.selectedElement) {
              elementOps.duplicateElementById(canvasState.selectedElement);
            }
          }}
          onToggleVisibility={() => {
            if (canvasState.selectedElement) {
              elementOps.toggleElementVisibility(canvasState.selectedElement);
            }
          }}
          onBringToFront={() => {
            if (canvasState.selectedElement) {
              elementOps.bringElementToFront(canvasState.selectedElement);
            }
          }}
          onSendToBack={() => {
            if (canvasState.selectedElement) {
              elementOps.sendElementToBack(canvasState.selectedElement);
            }
          }}
        />
      </div>

      {/* Flag Selector Modal (optional) */}
      {showFlagSelector && (
        <FlagSelectorModal
          onSelect={(flagUrl) => {
            elementOps.addElement('flag', 200, 50, { image: flagUrl });
            setShowFlagSelector(false);
          }}
          onClose={() => setShowFlagSelector(false)}
        />
      )}
    </div>
  );
}
```

## API Reference

### Hooks

#### `useCanvasState({ unit })`

Gestisce lo stato completo del canvas.

**Returns:**
- `elements` - Array di CanvasElement
- `setElements` - Setter per elementi
- `canvasWidth/Height` - Dimensioni canvas
- `canvasBackground/BorderWidth/BorderColor` - Stili canvas
- `selectedElement` - ID elemento selezionato
- `visibleElements` - Mappa visibilità
- `zoomLevel` - Livello zoom
- `getCanvasState()` - Helper per export completo

#### `useElementOperations({ elements, setElements, setSelectedElement })`

Operazioni CRUD su elementi.

**Methods:**
- `addElement(type, x?, y?, overrides?)` - Aggiunge elemento
- `updateElement(id, updates)` - Aggiorna parzialmente
- `deleteElement(id)` - Elimina
- `duplicateElementById(id)` - Duplica
- `moveElement(id, deltaX, deltaY)` - Sposta
- `resizeElement(id, width, height, x?, y?)` - Ridimensiona
- `bringElementToFront(id)` - Porta sopra
- `sendElementToBack(id)` - Porta sotto
- `toggleElementVisibility(id)` - Toggle visibilità
- `getElementById(id)` - Recupera elemento

#### `useImageUpload()`

Gestisce upload immagini.

**Returns:**
- `isUploading` - Boolean stato upload
- `uploadLogo(file)` - Upload logo
- `uploadFlag(file)` - Upload bandiera
- `uploadSilhouette(file)` - Upload silhouette
- `uploadGeneral(file)` - Upload immagine generica
- `setImageFromUrl(url)` - Usa URL esterno

#### `useTemplateManager({ unitId, currentTemplateId })`

Gestisce template.

**Returns:**
- `templateStates` - Stati template salvati
- `currentTemplateId` - Template attivo
- `templateStatesLoaded` - Flag caricamento
- `loadTemplateState(templateId)` - Carica singolo
- `saveTemplateState(templateId, state)` - Salva
- `applyTemplate(template, elements, formatOnly)` - Applica
- `loadAllTemplateStates()` - Carica tutti

### Components

Tutti i componenti sono memoizzati per performance ottimali.

## Performance Tips

1. **Memoization**: Tutti i componenti e metodi sono già memoizzati
2. **Undo/Redo**: Usa `useUndoRedo` esistente per history
3. **Auto-save**: Implementa debounce su `canvasState.elements` per auto-save
4. **Large canvases**: Considera virtualizzazione per 100+ elementi

## Migration from Old CanvasEditor

Il vecchio `CanvasEditor.tsx` può essere gradualmente migrato:

1. **Fase 1**: Sostituire logica state con `useCanvasState`
2. **Fase 2**: Sostituire logica CRUD con `useElementOperations`
3. **Fase 3**: Sostituire UI con componenti estratti
4. **Fase 4**: Ridurre CanvasEditor.tsx a solo orchestratore

## Testing

```typescript
// Test hook in isolamento
import { renderHook, act } from '@testing-library/react-hooks';
import { useCanvasState } from './hooks/useCanvasState';

test('should add element', () => {
  const { result } = renderHook(() => useCanvasState({}));

  act(() => {
    result.current.setElements([{
      id: 'test',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    }]);
  });

  expect(result.current.elements).toHaveLength(1);
});
```

## License

Internal use only - Naval Units Management System
