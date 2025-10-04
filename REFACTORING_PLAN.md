# Piano di Refactoring - CanvasEditor.tsx

## Stato Attuale
- **Linee di codice**: 2.237
- **useState hooks**: 22
- **useEffect hooks**: 6+
- **Responsabilità**: Tutto in un unico file (UI, logica, API, state management)

## Problema
Componente monolitico impossibile da:
- Testare in isolamento
- Debuggare efficacemente
- Manutenere nel tempo
- Riutilizzare parti specifiche

## Obiettivo
Spezzare in componenti e hooks riutilizzabili, mantenendo la funzionalità esistente.

---

## Architettura Proposta

### Struttura Directory
```
frontend/src/components/CanvasEditor/
├── CanvasEditor.tsx                    # Orchestratore principale (max 200 righe)
├── index.ts                            # Export barrel
├── hooks/
│   ├── useCanvasState.ts              # Gestione stato canvas (elements, dimensions)
│   ├── useTemplateManager.ts          # Caricamento/salvataggio template
│   ├── useImageUpload.ts              # Upload immagini (logo, flag, silhouette)
│   ├── useElementOperations.ts        # CRUD elementi canvas
│   └── useCanvasHistory.ts            # Undo/Redo (già esiste useUndoRedo)
├── components/
│   ├── CanvasToolbar.tsx              # Barra strumenti superiore
│   ├── CanvasWorkspace.tsx            # Area di lavoro canvas
│   ├── ElementsPanel.tsx              # Pannello aggiunta elementi (sinistra)
│   ├── PropertiesPanel.tsx            # Pannello proprietà elemento (destra)
│   ├── CanvasElement.tsx              # Singolo elemento renderizzato
│   └── FlagSelector.tsx               # Modal selezione bandiere
└── utils/
    ├── canvasConstants.ts             # Costanti (dimensioni, colori default)
    ├── elementHelpers.ts              # Funzioni utility per elementi
    └── coordinateHelpers.ts           # Calcoli coordinate e dimensioni
```

---

## Custom Hooks da Estrarre

### 1. `useCanvasState.ts`
**Responsabilità**: Gestione stato principale canvas
```typescript
export const useCanvasState = (initialUnit?: NavalUnit) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(1280);
  const [canvasHeight, setCanvasHeight] = useState(720);
  const [canvasBackground, setCanvasBackground] = useState('#FFFFFF');
  const [canvasBorderWidth, setCanvasBorderWidth] = useState(2);
  const [canvasBorderColor, setCanvasBorderColor] = useState('#000000');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  return {
    elements,
    setElements,
    canvasWidth,
    canvasHeight,
    canvasBackground,
    // ... altri getters/setters
  };
};
```

### 2. `useTemplateManager.ts`
**Responsabilità**: Caricamento, salvataggio, applicazione template
```typescript
export const useTemplateManager = (unitId?: number) => {
  const [templateStates, setTemplateStates] = useState({});
  const [currentTemplateId, setCurrentTemplateId] = useState('');

  const loadTemplateState = async (templateId: string) => { /* ... */ };
  const saveTemplateState = async (templateId: string, state: any) => { /* ... */ };
  const applyTemplate = (template: Template) => { /* ... */ };

  return {
    templateStates,
    currentTemplateId,
    loadTemplateState,
    saveTemplateState,
    applyTemplate,
  };
};
```

### 3. `useImageUpload.ts`
**Responsabilità**: Upload e gestione immagini
```typescript
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadLogo = async (file: File) => { /* ... */ };
  const uploadFlag = async (file: File) => { /* ... */ };
  const uploadSilhouette = async (file: File) => { /* ... */ };
  const uploadGeneral = async (file: File) => { /* ... */ };

  return {
    isUploading,
    uploadLogo,
    uploadFlag,
    uploadSilhouette,
    uploadGeneral,
  };
};
```

### 4. `useElementOperations.ts`
**Responsabilità**: Operazioni CRUD su elementi canvas
```typescript
export const useElementOperations = (elements, setElements) => {
  const addElement = (element: CanvasElement) => { /* ... */ };
  const updateElement = (id: string, updates: Partial<CanvasElement>) => { /* ... */ };
  const deleteElement = (id: string) => { /* ... */ };
  const duplicateElement = (id: string) => { /* ... */ };
  const moveElement = (id: string, deltaX: number, deltaY: number) => { /* ... */ };
  const resizeElement = (id: string, width: number, height: number) => { /* ... */ };

  return {
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    resizeElement,
  };
};
```

---

## Componenti da Estrarre

### 1. `CanvasToolbar.tsx` (~150 righe)
**Responsabilità**: Barra strumenti superiore
- Pulsanti Salva/Annulla
- Selezione template
- Undo/Redo
- Zoom controls (futuro)

**Props**:
```typescript
interface CanvasToolbarProps {
  onSave: () => void;
  onCancel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentTemplate: string;
  onTemplateChange: (templateId: string) => void;
}
```

### 2. `CanvasWorkspace.tsx` (~300 righe)
**Responsabilità**: Area di lavoro principale con canvas
- Rendering elementi
- Drag & drop
- Selezione elementi
- Resize handles

**Props**:
```typescript
interface CanvasWorkspaceProps {
  elements: CanvasElement[];
  selectedElementId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  canvasBorderWidth: number;
  canvasBorderColor: string;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onElementResize: (id: string, width: number, height: number) => void;
}
```

### 3. `ElementsPanel.tsx` (~200 righe)
**Responsabilità**: Pannello aggiunta elementi (lato sinistro)
- Bottoni per aggiungere testo, immagini, tabelle
- Upload immagini
- Selezione bandiere

**Props**:
```typescript
interface ElementsPanelProps {
  onAddTextElement: () => void;
  onAddTableElement: () => void;
  onAddLogoElement: () => void;
  onAddFlagElement: () => void;
  onAddSilhouetteElement: () => void;
  onUploadImage: (type: string) => void;
}
```

### 4. `PropertiesPanel.tsx` (~250 righe)
**Responsabilità**: Pannello proprietà elemento selezionato (lato destro)
- Modifica posizione/dimensioni
- Modifica stili (font, colori)
- Modifica contenuto (testo, tabella)

**Props**:
```typescript
interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onElementUpdate: (updates: Partial<CanvasElement>) => void;
  onElementDelete: () => void;
  onElementDuplicate: () => void;
}
```

### 5. `CanvasElement.tsx` (~100 righe)
**Responsabilità**: Rendering singolo elemento con handle resize/move
- Gestione drag
- Gestione resize
- Visualizzazione contenuto

**Props**:
```typescript
interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onResize: (width: number, height: number) => void;
}
```

---

## Costanti da Estrarre

### `canvasConstants.ts`
```typescript
export const CANVAS_FORMATS = {
  POWERPOINT: { width: 1280, height: 720, name: 'PowerPoint (16:9)' },
  A4_PORTRAIT: { width: 794, height: 1123, name: 'A4 Verticale' },
  A4_LANDSCAPE: { width: 1123, height: 794, name: 'A4 Orizzontale' },
  A3_PORTRAIT: { width: 1123, height: 1587, name: 'A3 Verticale' },
  A3_LANDSCAPE: { width: 1587, height: 1123, name: 'A3 Orizzontale' },
} as const;

export const DEFAULT_ELEMENT_STYLES = {
  text: { fontSize: 16, color: '#000000', fontWeight: 'normal' },
  table: { fontSize: 12, borderColor: '#000000', borderWidth: 1 },
} as const;

export const DEFAULT_TABLE_DATA = [
  ['LUNGHEZZA', 'XXX m', 'LARGHEZZA', 'XXX m'],
  ['DISLOCAMENTO', 'XXX t', 'VELOCITÀ', 'XXX kn'],
  ['EQUIPAGGIO', 'XXX', 'ARMA', 'XXX']
];
```

---

## Piano di Implementazione (Step-by-Step)

### Fase 1: Preparazione (1 giorno)
1. ✅ Creare directory structure
2. ✅ Estrarre costanti in `canvasConstants.ts`
3. ✅ Creare file utils per helper functions

### Fase 2: Custom Hooks (2-3 giorni)
1. Estrarre `useCanvasState` - Stato base
2. Estrarre `useElementOperations` - CRUD elementi
3. Estrarre `useImageUpload` - Upload immagini
4. Estrarre `useTemplateManager` - Template management

### Fase 3: Componenti UI (3-4 giorni)
1. Estrarre `CanvasToolbar` - Barra superiore
2. Estrarre `ElementsPanel` - Pannello sinistro
3. Estrarre `PropertiesPanel` - Pannello destro
4. Estrarre `CanvasElement` - Singolo elemento
5. Estrarre `CanvasWorkspace` - Area canvas
6. Refactoring `CanvasEditor.tsx` - Solo orchestrazione

### Fase 4: Testing & Refinement (1-2 giorni)
1. Test funzionalità esistenti
2. Fix bug emersi
3. Ottimizzazioni performance
4. Documentazione

**Tempo totale stimato**: 7-10 giorni

---

## Benefici Attesi

### Manutenibilità
- ✅ Ogni file < 300 righe (target < 200)
- ✅ Responsabilità chiare e separate
- ✅ Testabilità in isolamento

### Performance
- ✅ Memoizzazione più efficace
- ✅ Re-render ridotti (solo componenti necessari)
- ✅ Lazy loading possibile per pannelli

### Developer Experience
- ✅ Onboarding più veloce
- ✅ Debug più semplice
- ✅ Riusabilità componenti/hooks

### Metriche Target
- **CanvasEditor.tsx**: Da 2.237 → 150-200 righe
- **Componenti estratti**: 5-7 files da 100-250 righe
- **Custom hooks**: 4-5 hooks riutilizzabili
- **Riduzione complessità**: -70%

---

## Rischi e Mitigazioni

### Rischio 1: Regressione funzionalità
**Mitigazione**: Test manuali step-by-step, commit frequenti

### Rischio 2: Prop drilling eccessivo
**Mitigazione**: Context API se necessario, ma preferire props esplicite

### Rischio 3: Over-engineering
**Mitigazione**: Iniziare semplice, iterare se necessario

---

## Prossimi Step Immediati

1. [ ] Creare directory `CanvasEditor/`
2. [ ] Estrarre `canvasConstants.ts`
3. [ ] Estrarre `useCanvasState` hook
4. [ ] Testare hook in isolamento
5. [ ] Procedere con hook successivo

---

**Status**: 📋 Piano approvato - Pronto per implementazione
**Owner**: Claude Code
**Data**: 2025-10-03
