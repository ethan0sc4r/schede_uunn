# Frontend Guide - Naval Units Management System

**Complete technical documentation for the React frontend application**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Routing & Navigation](#routing--navigation)
9. [Canvas Editor System](#canvas-editor-system)
10. [Template System](#template-system)
11. [Image Management](#image-management)
12. [Authentication Flow](#authentication-flow)
13. [Styling & UI](#styling--ui)
14. [Development Workflow](#development-workflow)
15. [Common Patterns](#common-patterns)
16. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The frontend is a **Single Page Application (SPA)** built with React 19, TypeScript, and Vite. It follows a component-based architecture with:

- **Pages**: Top-level route components
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for logic reuse
- **Services**: API client and utilities
- **Contexts**: Global state management
- **Types**: TypeScript definitions

### Key Features

- Visual canvas editor for naval unit cards (drag-and-drop)
- Template system with predefined and custom layouts
- Gallery management with image upload
- Group hierarchy and presentation mode
- Quiz functionality
- Admin panel for user management
- Real-time authentication with JWT tokens

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI framework |
| **TypeScript** | Latest | Type safety |
| **Vite** | 7.0.6 | Build tool & dev server |
| **TailwindCSS** | 3.x | Utility-first CSS |
| **React Router** | 6.x | Client-side routing |
| **TanStack Query** | Latest | Server state management |
| **Axios** | Latest | HTTP client |
| **Lucide React** | Latest | Icon library |

### Additional Libraries

- `react-to-print` - Print functionality
- `html2canvas` - Canvas to image conversion
- `@tailwindcss/typography` - Rich text styling

---

## Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── CanvasEditor/           # Canvas editor module
│   │   │   ├── components/         # Canvas UI components
│   │   │   │   ├── CanvasToolbar.tsx
│   │   │   │   ├── CanvasWorkspace.tsx
│   │   │   │   ├── CanvasElement.tsx
│   │   │   │   ├── ElementsPanel.tsx
│   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   └── TemplateSelector.tsx
│   │   │   ├── hooks/              # Canvas custom hooks
│   │   │   │   ├── useCanvasState.ts
│   │   │   │   ├── useElementOperations.ts
│   │   │   │   ├── useImageUpload.ts
│   │   │   │   └── useTemplateManager.ts
│   │   │   ├── utils/              # Canvas utilities
│   │   │   │   ├── canvasConstants.ts
│   │   │   │   ├── canvasTypes.ts
│   │   │   │   └── elementHelpers.ts
│   │   │   └── index.ts            # Module barrel export
│   │   ├── TemplateManager.tsx     # Template CRUD UI
│   │   ├── NavalUnitWizard.tsx     # Create unit wizard
│   │   ├── PresentationMode.tsx    # Slideshow component
│   │   ├── GroupModalAdvanced.tsx  # Group management
│   │   ├── NotesEditor.tsx         # WYSIWYG editor
│   │   ├── ProtectedRoute.tsx      # Auth guard
│   │   └── ...                     # Other components
│   ├── pages/            # Page components
│   │   ├── NavalUnits.tsx          # Main units page
│   │   ├── Groups.tsx              # Groups page
│   │   ├── Admin.tsx               # Admin panel
│   │   ├── Quiz.tsx                # Quiz page
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Registration page
│   │   └── PublicUnit.tsx          # Public view
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx         # Authentication
│   │   └── ToastContext.tsx        # Toast notifications
│   ├── hooks/            # Global custom hooks
│   │   └── useAuth.tsx             # Auth hook
│   ├── services/         # API & utilities
│   │   └── api.ts                  # Axios API client
│   ├── types/            # TypeScript types
│   │   └── index.ts                # All type definitions
│   ├── utils/            # Utility functions
│   │   └── imageUtils.ts           # Image URL helpers
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles (Tailwind)
├── .env                  # Environment variables
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind config
└── package.json          # Dependencies
```

---

## Core Concepts

### 1. Naval Unit

A **Naval Unit** represents a ship/vessel with:
- Basic info: name, class, nation
- Images: logo, flag, silhouette
- Characteristics: technical specifications
- Gallery: additional photos
- Layout: canvas configuration stored as JSON
- Template: current template ID

**Type Definition** (`types/index.ts`):
```typescript
export interface NavalUnit {
  id: number;
  name: string;
  unit_class: string;
  nation?: string;
  logo_path?: string;
  flag_path?: string;
  silhouette_path?: string;
  background_color: string;
  current_template_id?: string;
  layout_config?: CanvasElement[];
  characteristics: UnitCharacteristic[];
  gallery?: GalleryImage[];
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### 2. Template

A **Template** defines the layout structure for naval unit cards:
- Canvas dimensions (A4, A3, PowerPoint 16:9, custom)
- Canvas style (background, border)
- Element positions and styles
- Can be default (system) or custom (user-created)

**Type Definition** (`components/TemplateManager.tsx`):
```typescript
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  elements: CanvasElement[];
  canvasWidth?: number;
  canvasHeight?: number;
  canvasBackground?: string;
  canvasBorderWidth?: number;
  canvasBorderColor?: string;
  createdAt: string;
  isDefault?: boolean;
}
```

### 3. Canvas Element

A **Canvas Element** is a draggable/resizable item on the canvas:
- Types: `logo`, `flag`, `silhouette`, `text`, `table`, `unit_name`, `unit_class`
- Position: x, y coordinates
- Size: width, height
- Content: text, image path, or table data
- Style: colors, fonts, borders

**Type Definition** (`components/CanvasEditor/utils/canvasTypes.ts`):
```typescript
export interface CanvasElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'text' | 'table' | 'unit_name' | 'unit_class';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  image?: string;
  tableData?: string[][];
  isFixed?: boolean;
  visible?: boolean;
  style?: CanvasElementStyle;
}
```

### 4. Group

A **Group** organizes naval units into collections:
- Hierarchical (can have parent/subgroups)
- Template overrides for logos/flags
- Presentation configuration for slideshows
- PowerPoint export functionality

---

## Component Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
├── ToastProvider (Context)
└── Router
    ├── Login
    ├── Register
    ├── ProtectedRoute
    │   ├── NavalUnits (Page)
    │   │   ├── NavalUnitWizard
    │   │   ├── CanvasEditor
    │   │   └── GalleryManager
    │   ├── Groups (Page)
    │   │   ├── GroupModalAdvanced
    │   │   └── PresentationMode
    │   ├── Admin (Page)
    │   └── Quiz (Page)
    └── PublicUnit (Public)
```

### Component Categories

#### 1. Page Components (`pages/`)

Top-level route components that compose smaller components.

**Example: NavalUnits.tsx**
```typescript
export default function NavalUnits() {
  const [units, setUnits] = useState<NavalUnit[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUnit, setSelectedUnit] = useState<NavalUnit | null>(null);

  // Fetch units on mount
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    const data = await navalUnitsApi.getAll();
    setUnits(data);
  };

  return (
    <div>
      {/* Toolbar */}
      {/* Unit Grid/List */}
      {/* Modals */}
      {selectedUnit && <CanvasEditor unit={selectedUnit} />}
    </div>
  );
}
```

#### 2. Feature Components (`components/`)

Self-contained feature modules with their own state and logic.

**Examples:**
- `CanvasEditor` - Visual layout editor
- `TemplateManager` - Template CRUD
- `NavalUnitWizard` - Multi-step creation wizard
- `PresentationMode` - Fullscreen slideshow

#### 3. UI Components

Reusable presentational components (buttons, cards, modals).

**Pattern:**
```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold p-4 border-b">{title}</h3>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

---

## State Management

### 1. Local State (useState)

For component-specific state:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', class: '' });
```

### 2. Server State (TanStack Query)

For data fetching with caching:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data: units, isLoading, error } = useQuery({
  queryKey: ['units'],
  queryFn: navalUnitsApi.getAll,
});

// Mutate data
const createMutation = useMutation({
  mutationFn: navalUnitsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['units'] });
  },
});
```

### 3. Global State (Context API)

For app-wide state (auth, toasts):

**AuthContext Example:**
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { access_token } = await authApi.login({ email, password });
    setAuthToken(access_token);
    await loadUser();
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**ToastContext Example:**
```typescript
// contexts/ToastContext.tsx
export function useToast() {
  const context = useContext(ToastContext);
  return {
    success: (message: string) => context.addToast('success', message),
    error: (message: string) => context.addToast('error', message),
    info: (message: string) => context.addToast('info', message),
  };
}
```

---

## API Integration

### API Client Setup (`services/api.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth token management
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Modules

#### Naval Units API
```typescript
export const navalUnitsApi = {
  getAll: async (skip = 0, limit = 100): Promise<NavalUnit[]> => {
    const response = await api.get(`/api/units?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: number): Promise<NavalUnit> => {
    const response = await api.get(`/api/units/${id}`);
    return response.data;
  },

  create: async (unit: CreateNavalUnitRequest): Promise<NavalUnit> => {
    const response = await api.post('/api/units', unit);
    return response.data;
  },

  update: async (id: number, unit: Partial<CreateNavalUnitRequest>): Promise<NavalUnit> => {
    const response = await api.put(`/api/units/${id}`, unit);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/units/${id}`);
  },

  // Image uploads
  uploadLogo: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-logo`, formData);
    return response.data;
  },

  // Template states
  saveTemplateState: async (unitId: number, templateId: string, stateData: any): Promise<void> => {
    await api.post(`/api/units/${unitId}/template-states/${templateId}`, stateData);
  },

  // Gallery
  uploadGalleryImage: async (id: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/gallery/upload`, formData);
    return response.data;
  },

  // Export
  exportPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/units/${id}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
```

#### Templates API
```typescript
export const templatesApi = {
  getAll: async (): Promise<Template[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  create: async (templateData: Template): Promise<{ template_id: string }> => {
    const response = await api.post('/api/templates', templateData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/templates/${id}`);
  },

  // Template states for units
  getTemplateState: async (unitId: number, templateId: string): Promise<any> => {
    const response = await api.get(`/api/units/${unitId}/template-states/${templateId}`);
    return response.data;
  },
};
```

---

## Routing & Navigation

### Router Setup (`App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public/units/:id" element={<PublicUnit />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><NavalUnits /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
```

### Protected Route Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## Canvas Editor System

The **CanvasEditor** is the most complex feature. It's a visual drag-and-drop editor for creating naval unit cards.

### Architecture

```
CanvasEditor (Container)
├── CanvasToolbar (Top bar with save/cancel)
│   └── TemplateSelector (Template picker)
├── ElementsPanel (Left: element library)
├── CanvasWorkspace (Center: drag-drop canvas)
│   └── CanvasElement[] (Individual elements)
└── PropertiesPanel (Right: element properties)
```

### Main Component

```typescript
// components/CanvasEditor.tsx
export default function CanvasEditor({
  unit,
  onSave,
  onCancel
}: CanvasEditorProps) {
  // State management via custom hooks
  const {
    elements,
    canvasConfig,
    selectedElement,
    setSelectedElement,
    addElement,
    updateElement,
    deleteElement,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useCanvasState(unit);

  const {
    handleImageUpload,
    uploadLogo,
    uploadFlag,
    uploadSilhouette,
  } = useImageUpload(unit.id, updateElement);

  const {
    applyTemplate,
    saveCurrentAsTemplate,
  } = useTemplateManager(unit.id);

  return (
    <div className="flex flex-col h-screen">
      <CanvasToolbar
        onSave={handleSave}
        onCancel={onCancel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="flex flex-1 overflow-hidden">
        <ElementsPanel onAddElement={addElement} />

        <CanvasWorkspace
          elements={elements}
          canvasConfig={canvasConfig}
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          onUpdateElement={updateElement}
        />

        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onImageUpload={handleImageUpload}
        />
      </div>
    </div>
  );
}
```

### Custom Hooks

#### useCanvasState

Manages canvas elements and undo/redo history:

```typescript
// components/CanvasEditor/hooks/useCanvasState.ts
export function useCanvasState(unit: NavalUnit) {
  const [elements, setElements] = useState<CanvasElement[]>(
    unit.layout_config || []
  );
  const [history, setHistory] = useState<CanvasElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    canvasWidth: 1123,
    canvasHeight: 794,
    canvasBackground: unit.background_color || '#ffffff',
    canvasBorderWidth: 2,
    canvasBorderColor: '#000000',
  });

  const addElement = useCallback((type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      style: getDefaultStyleForType(type),
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(newElement.id);
  }, [elements]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  }, [elements]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  return {
    elements,
    canvasConfig,
    selectedElement,
    setSelectedElement,
    addElement,
    updateElement,
    deleteElement,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
  };
}
```

#### useElementOperations

Handles drag, resize, and selection:

```typescript
// components/CanvasEditor/hooks/useElementOperations.ts
export function useElementOperations(
  element: CanvasElement,
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - element.x, y: e.clientY - element.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onUpdate(element.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    if (isResizing && resizeHandle) {
      const updates = calculateResize(e, element, resizeHandle, dragStart);
      onUpdate(element.id, updates);
    }
  }, [isDragging, isResizing, dragStart, element, resizeHandle]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove]);

  return { handleMouseDown, handleResizeStart };
}
```

### Canvas Workspace

Renders the canvas with all elements:

```typescript
// components/CanvasEditor/components/CanvasWorkspace.tsx
export default function CanvasWorkspace({
  elements,
  canvasConfig,
  selectedElement,
  onSelectElement,
  onUpdateElement,
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8">
      <div
        ref={canvasRef}
        className="mx-auto shadow-2xl relative"
        style={{
          width: canvasConfig.canvasWidth,
          height: canvasConfig.canvasHeight,
          backgroundColor: canvasConfig.canvasBackground,
          border: `${canvasConfig.canvasBorderWidth}px solid ${canvasConfig.canvasBorderColor}`,
        }}
        onClick={() => onSelectElement(null)}
      >
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElement}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={onUpdateElement}
          />
        ))}
      </div>
    </div>
  );
}
```

### Canvas Element

Individual draggable/resizable element:

```typescript
// components/CanvasEditor/components/CanvasElement.tsx
export default function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
}: CanvasElementProps) {
  const { handleMouseDown, handleResizeStart } = useElementOperations(element, onUpdate);

  const renderContent = () => {
    switch (element.type) {
      case 'logo':
      case 'flag':
      case 'silhouette':
        return element.image ? (
          <img src={element.image} alt={element.type} className="w-full h-full object-contain" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {element.type.toUpperCase()}
          </div>
        );

      case 'text':
      case 'unit_name':
      case 'unit_class':
        return (
          <div
            style={{
              fontSize: element.style?.fontSize || 16,
              color: element.style?.color || '#000',
              fontWeight: element.style?.fontWeight || 'normal',
              textAlign: element.style?.textAlign || 'left',
            }}
          >
            {element.content || 'Testo'}
          </div>
        );

      case 'table':
        return <TableRenderer tableData={element.tableData} style={element.style} />;

      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        backgroundColor: element.style?.backgroundColor,
        borderRadius: element.style?.borderRadius,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {renderContent()}

      {isSelected && (
        <>
          {/* Resize handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize"
               onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize"
               onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize"
               onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize"
               onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  );
}
```

---

## Template System

Templates define reusable layouts for naval unit cards.

### Default Templates

Located in `components/TemplateManager.tsx`:

```typescript
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'naval-card-standard',
    name: 'Scheda Navale Standard',
    description: 'Layout classico con logo, bandiera, silhouette e tabella',
    isDefault: true,
    canvasWidth: 1123,
    canvasHeight: 794,
    canvasBackground: '#ffffff',
    elements: [
      { id: 'logo', type: 'logo', x: 20, y: 20, width: 120, height: 120 },
      { id: 'flag', type: 'flag', x: 983, y: 20, width: 120, height: 80 },
      { id: 'silhouette', type: 'silhouette', x: 20, y: 180, width: 1083, height: 300 },
      // ... more elements
    ],
  },
  // ... more templates
];
```

### Template Manager Component

CRUD interface for templates:

```typescript
export default function TemplateManager({
  onSelectTemplate,
  onClose,
  currentElements,
  currentCanvasWidth,
  currentCanvasHeight,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const apiTemplates = await templatesApi.getAll();
    const allTemplates = [...DEFAULT_TEMPLATES, ...apiTemplates];
    setTemplates(allTemplates);
  };

  const saveCurrentAsTemplate = async () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      elements: currentElements,
      canvasWidth: currentCanvasWidth,
      canvasHeight: currentCanvasHeight,
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    await templatesApi.create(newTemplate);
    await loadTemplates();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg max-w-6xl">
        {/* Template grid */}
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4">
              <h3>{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <button onClick={() => onSelectTemplate(template, false)}>
                Applica
              </button>
              <button onClick={() => onSelectTemplate(template, true)}>
                Solo Formato
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Template Application Modes

1. **Full Application** (`formatOnly: false`)
   - Replaces ALL elements on canvas
   - Used when starting fresh or completely changing layout

2. **Format Only** (`formatOnly: true`)
   - Preserves existing content (images, text)
   - Updates only positions and styles
   - Used to reformat existing content

```typescript
const applyTemplate = (template: Template, formatOnly: boolean) => {
  if (formatOnly) {
    // Merge: keep content, update positions/styles
    const updatedElements = template.elements.map(templateEl => {
      const existing = elements.find(el => el.type === templateEl.type);
      return existing
        ? { ...templateEl, content: existing.content, image: existing.image }
        : templateEl;
    });
    setElements(updatedElements);
  } else {
    // Replace all
    setElements(template.elements);
  }

  setCanvasConfig({
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    canvasBackground: template.canvasBackground,
    canvasBorderWidth: template.canvasBorderWidth,
    canvasBorderColor: template.canvasBorderColor,
  });
};
```

### Template State Persistence

Each unit can save different states for different templates:

```typescript
// Save state for specific template
await navalUnitsApi.saveTemplateState(unitId, templateId, {
  elements,
  canvasConfig,
});

// Load state for specific template
const savedState = await templatesApi.getTemplateState(unitId, templateId);
if (savedState) {
  setElements(savedState.elements);
  setCanvasConfig(savedState.canvasConfig);
}
```

---

## Image Management

### Image Upload Flow

1. User selects file via input or drag-drop
2. File sent to backend via FormData
3. Backend saves to `/data/uploads/{category}/`
4. Returns relative path (e.g., `uploads/logos/uuid.jpg`)
5. Frontend updates element with image path
6. Image displayed via `getImageUrl()` helper

### Upload Implementation

```typescript
// components/CanvasEditor/hooks/useImageUpload.ts
export function useImageUpload(
  unitId: number,
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void
) {
  const uploadLogo = async (file: File, elementId: string) => {
    try {
      const response = await navalUnitsApi.uploadLogo(unitId, file);
      const imagePath = response.path;

      onUpdate(elementId, {
        image: getImageUrl(imagePath),
      });

      return imagePath;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const uploadSilhouette = async (file: File, elementId: string) => {
    const response = await navalUnitsApi.uploadSilhouette(unitId, file);
    onUpdate(elementId, { image: getImageUrl(response.path) });
  };

  const uploadFlag = async (file: File, elementId: string) => {
    const response = await navalUnitsApi.uploadFlag(unitId, file);
    onUpdate(elementId, { image: getImageUrl(response.path) });
  };

  return { uploadLogo, uploadSilhouette, uploadFlag };
}
```

### Image URL Helper

```typescript
// utils/imageUtils.ts
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Already full URL
  if (path.startsWith('http')) return path;

  // Relative path
  return path.startsWith('/')
    ? `${API_BASE_URL}${path}`
    : `${API_BASE_URL}/${path}`;
}
```

### Gallery Management

```typescript
// In NavalUnits page
const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

const loadGallery = async (unitId: number) => {
  const { gallery } = await navalUnitsApi.getGallery(unitId);
  setGalleryImages(gallery);
};

const uploadGalleryImage = async (file: File) => {
  await navalUnitsApi.uploadGalleryImage(selectedUnit.id, file);
  await loadGallery(selectedUnit.id);
};

const deleteGalleryImage = async (imageId: number) => {
  await navalUnitsApi.deleteGalleryImage(selectedUnit.id, imageId);
  await loadGallery(selectedUnit.id);
};

const updateImageOrder = async (imageId: number, newOrder: number) => {
  await navalUnitsApi.updateGalleryOrder(selectedUnit.id, imageId, newOrder);
  await loadGallery(selectedUnit.id);
};
```

---

## Authentication Flow

### 1. Login Process

```typescript
// pages/Login.tsx
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### 2. Token Management

```typescript
// services/api.ts
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Initialize on app load
const storedToken = localStorage.getItem('auth_token');
if (storedToken) {
  setAuthToken(storedToken);
}
```

### 3. User Activation

New users must be activated by admin:

```typescript
// pages/Admin.tsx
const activateUser = async (userId: number) => {
  await adminApi.activateUser(userId);
  await loadUsers();
  success('User activated successfully');
};

const deactivateUser = async (userId: number) => {
  await adminApi.deactivateUser(userId);
  await loadUsers();
  warning('User deactivated');
};
```

---

## Styling & UI

### TailwindCSS Setup

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

### Global Styles

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors;
  }

  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

### Common Patterns

#### Modal
```typescript
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h2 className="text-xl font-bold mb-4">Modal Title</h2>
      {/* Content */}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-secondary" onClick={() => setShowModal(false)}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

#### Loading Spinner
```typescript
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
) : (
  <Content />
)}
```

#### Grid/List Toggle
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

<div className={viewMode === 'grid'
  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
  : 'space-y-4'
}>
  {items.map(item => (
    <ItemCard key={item.id} item={item} viewMode={viewMode} />
  ))}
</div>
```

---

## Development Workflow

### 1. Environment Setup

```bash
# Install dependencies
cd frontend
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8001" > .env

# Start dev server
npm run dev
```

### 2. Development Server

```bash
npm run dev
# Runs on http://localhost:5173
# Hot reload enabled
# TypeScript checking in terminal
```

### 3. Building for Production

```bash
npm run build
# Output: dist/ folder
# Optimized and minified
# Ready for deployment
```

### 4. Type Checking

```bash
# Run TypeScript compiler check
npm run tsc

# Or continuous watch mode
tsc --watch --noEmit
```

### 5. Code Organization

**When adding a new feature:**

1. Create types in `types/index.ts`
2. Add API methods to `services/api.ts`
3. Create component in `components/` or `pages/`
4. Add route to `App.tsx` if needed
5. Update relevant contexts if global state needed

**Example: Adding a new "Comments" feature**

```typescript
// 1. Add types
export interface Comment {
  id: number;
  unit_id: number;
  user_id: number;
  text: string;
  created_at: string;
}

// 2. Add API
export const commentsApi = {
  getByUnit: async (unitId: number): Promise<Comment[]> => {
    const response = await api.get(`/api/units/${unitId}/comments`);
    return response.data;
  },
  create: async (unitId: number, text: string): Promise<Comment> => {
    const response = await api.post(`/api/units/${unitId}/comments`, { text });
    return response.data;
  },
};

// 3. Create component
export function CommentsSection({ unitId }: { unitId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    loadComments();
  }, [unitId]);

  const loadComments = async () => {
    const data = await commentsApi.getByUnit(unitId);
    setComments(data);
  };

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
    </div>
  );
}
```

---

## Common Patterns

### 1. Data Fetching Pattern

```typescript
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const result = await api.getData();
    setData(result);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Form Handling Pattern

```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
});

const [errors, setErrors] = useState<Record<string, string>>({});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error on change
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.field1.trim()) {
    newErrors.field1 = 'Required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  try {
    await api.submitData(formData);
    success('Saved!');
  } catch (err) {
    error('Failed to save');
  }
};
```

### 3. File Upload Pattern

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    error('File too large');
    return;
  }

  if (!file.type.startsWith('image/')) {
    error('Only images allowed');
    return;
  }

  // Upload
  try {
    setIsUploading(true);
    const result = await api.uploadImage(file);
    setImageUrl(result.url);
    success('Uploaded!');
  } catch (err) {
    error('Upload failed');
  } finally {
    setIsUploading(false);
  }
};

// Usage
<input
  type="file"
  accept="image/*"
  onChange={handleFileUpload}
  disabled={isUploading}
/>
```

### 4. Debounced Search Pattern

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);

const performSearch = async (query: string) => {
  const results = await api.search(query);
  setSearchResults(results);
};
```

### 5. Pagination Pattern

```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const pageSize = 20;

const loadPage = async (pageNum: number) => {
  const skip = (pageNum - 1) * pageSize;
  const { items, total } = await api.getPaginated(skip, pageSize);
  setData(items);
  setTotalPages(Math.ceil(total / pageSize));
  setPage(pageNum);
};

// Pagination UI
<div className="flex items-center gap-2">
  <button
    onClick={() => loadPage(page - 1)}
    disabled={page === 1}
  >
    Previous
  </button>

  <span>Page {page} of {totalPages}</span>

  <button
    onClick={() => loadPage(page + 1)}
    disabled={page === totalPages}
  >
    Next
  </button>
</div>
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Check backend CORS settings and ensure `VITE_API_BASE_URL` is correct:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8001
```

#### 2. 401 Unauthorized

**Problem**: All API calls return 401

**Solution**:
- Check if token exists: `localStorage.getItem('auth_token')`
- Verify token is valid (not expired)
- Re-login to get fresh token

#### 3. Images Not Loading

**Problem**: Broken image icons, 404 errors

**Solution**:
- Check image path in database (should be relative like `uploads/logos/file.jpg`)
- Verify `API_BASE_URL` is set correctly
- Check backend static files are served at `/uploads`
- Use `getImageUrl()` helper for all image paths

#### 4. Build Errors

**Problem**: `npm run build` fails with TypeScript errors

**Solution**:
```bash
# Check types
npm run tsc

# Fix any type errors
# Common fixes:
- Add `?` for optional props
- Use `any` temporarily for complex types
- Check import paths are correct
```

#### 5. Canvas Not Updating

**Problem**: Changes in canvas editor don't persist

**Solution**:
- Ensure `onSave` calls `navalUnitsApi.update()` with `layout_config`
- Check browser console for API errors
- Verify layout_config is properly serialized JSON

#### 6. Template Not Applying

**Problem**: Template selection doesn't change canvas

**Solution**:
- Check template has valid `elements` array
- Verify canvas config is updated (width, height, background)
- Use browser DevTools to inspect state changes

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const CanvasEditor = lazy(() => import('./components/CanvasEditor'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CanvasEditor />
    </Suspense>
  );
}
```

### 2. Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memo for expensive components
const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* Complex rendering */}</div>;
});

// useMemo for expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// useCallback for stable function references
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### 3. Virtual Scrolling

For large lists (e.g., 1000+ units):

```bash
npm install react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Guidelines

### Unit Testing (Recommended)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// Example: useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

test('login sets user', async () => {
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.login('test@example.com', 'password');
  });

  expect(result.current.user).not.toBeNull();
  expect(result.current.user?.email).toBe('test@example.com');
});
```

### Integration Testing

Test full user flows:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import NavalUnits from './pages/NavalUnits';

test('create new unit flow', async () => {
  render(<NavalUnits />);

  // Click create button
  fireEvent.click(screen.getByText('Create Unit'));

  // Fill form
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'USS Test' },
  });

  // Submit
  fireEvent.click(screen.getByText('Save'));

  // Verify
  expect(await screen.findByText('USS Test')).toBeInTheDocument();
});
```

---

## Deployment

### Build Process

```bash
# Build frontend
cd frontend
npm run build

# Output in dist/ folder
# - dist/index.html
# - dist/assets/*.js
# - dist/assets/*.css
```

### Environment Variables

```bash
# Production .env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Docker Deployment

```dockerfile
# Dockerfile (already configured in project)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Static Hosting (Vercel/Netlify)

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variable: `VITE_API_BASE_URL`
5. Deploy

---

## Summary

This frontend is a complex React application with:

- **Visual canvas editor** for drag-and-drop card design
- **Template system** for reusable layouts
- **Image management** with upload and gallery
- **Authentication** with JWT and protected routes
- **State management** with Context API and TanStack Query
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Modular architecture** with hooks and components

Key files to understand:
1. `App.tsx` - Router and providers
2. `services/api.ts` - All API calls
3. `components/CanvasEditor/` - Visual editor system
4. `components/TemplateManager.tsx` - Template CRUD
5. `contexts/AuthContext.tsx` - Authentication
6. `types/index.ts` - TypeScript definitions

**Development workflow**: Edit components → TypeScript checks → Hot reload → Test in browser → Build for production.
