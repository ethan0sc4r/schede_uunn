# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Naval Units Management System** - A full-stack web application for creating, managing, and exporting naval unit information sheets with a visual canvas editor and presentation capabilities.

**Tech Stack:**
- **Backend**: FastAPI (Python) + SQLite with simple_database module
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Database**: SQLite with custom SimpleDatabase wrapper (not SQLAlchemy in main entry point)
- **Export**: ReportLab (PDF), Pillow (PNG), python-pptx (PowerPoint), xlsxwriter (Excel)

## Quick Start (First Time Setup)

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Initialize database and create admin user
python init_and_create_admin.py  # Creates admin@example.com / admin123

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Configure frontend environment
echo "VITE_API_BASE_URL=http://localhost:8001" > .env

# 6. Start development (two terminals)
# Terminal 1: cd backend && ../venv/bin/python -m uvicorn simple_main:app --reload --port 8001
# Terminal 2: cd frontend && npm run dev

# Access at: http://localhost:5173
```

## Development Commands

### Prerequisites

Before starting, ensure you have:
- Python 3.8+ (Python 3.13 compatible with simple_main.py)
- Node.js 16+
- Virtual environment set up: `python -m venv venv` (venv directory should exist at project root)

### Start Development Servers

**Recommended (macOS/Linux):**
```bash
# Terminal 1 - Backend
cd backend
../venv/bin/python -m uvicorn simple_main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Windows:**
```cmd
# Use provided batch scripts
start_simple_backend.bat # Backend using simple_main.py (recommended, Python 3.13 compatible)
start_backend.bat        # Legacy backend (uses main.py, may have SQLAlchemy issues)
start_frontend.bat       # Frontend dev server
start_servers.bat        # Both servers combined
```

**Note**: The main backend entry point is [simple_main.py](backend/simple_main.py), NOT `main.py`. The port is **8001**, not 8000.

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
- Default admin credentials: `admin@example.com` / `admin123`

### Other Commands
```bash
# Install backend dependencies
cd backend && pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Build frontend for production
cd frontend && npm run build

# Run with Docker Compose
docker-compose up --build

# Create admin user manually
cd backend && python create_admin.py
```

## Architecture & Key Patterns

### Database Architecture

The application uses a **custom SQLite wrapper** ([app/simple_database.py](backend/app/simple_database.py)) instead of SQLAlchemy for the main application. This is critical to understand:

- **SimpleDatabase class**: Custom ORM-like wrapper with JSON storage for complex fields
- **Direct SQL queries**: Most operations use raw SQL through the SimpleDatabase interface
- **Schema**: Auto-created on first run with `init_database()`
- **Data location**: `data/naval_units.db` (excluded from git)

### Backend Structure

```
backend/
├── simple_main.py           # Main FastAPI entry point (PORT 8001)
├── app/
│   ├── simple_database.py   # Custom SQLite wrapper (NOT SQLAlchemy)
│   └── schemas.py           # Pydantic models for API validation
├── api/
│   ├── auth.py              # JWT authentication
│   ├── naval_units.py       # CRUD for units (NOT USED - see simple_main.py)
│   ├── groups.py            # Groups management
│   ├── admin.py             # Admin panel
│   └── quiz.py              # Quiz functionality
├── models/                  # SQLAlchemy models (for reference, not actively used)
│   ├── naval_unit.py        # NavalUnit & UnitCharacteristic
│   ├── group.py             # Group & GroupMembership
│   └── user.py              # User model
└── utils/
    ├── powerpoint_export.py # PowerPoint generation
    └── png_export.py        # PNG rendering
```

**Important**: Most API endpoints are defined **directly in simple_main.py** as inline route handlers, not in separate api/ modules. The api/ modules exist but may not be actively used.

### Frontend Structure

```
frontend/src/
├── components/
│   ├── CanvasEditor.tsx        # Main Canvas Editor component (entry point)
│   ├── CanvasEditor/           # Modular Canvas Editor system (refactored)
│   │   ├── components/         # Canvas UI components (Toolbar, Workspace, Elements, etc.)
│   │   ├── hooks/              # Custom hooks (useCanvasState, useElementOperations, etc.)
│   │   └── utils/              # Canvas utilities (types, constants, helpers)
│   ├── TemplateManager.tsx     # Template system with predefined layouts
│   ├── PresentationMode.tsx    # Slideshow mode for groups
│   ├── GroupModalAdvanced.tsx  # Advanced group management
│   ├── GalleryManager.tsx      # Gallery management with upload/delete
│   ├── VersionManager.tsx      # Version control for layouts
│   └── NotesEditor.tsx         # WYSIWYG editor for notes
├── pages/
│   ├── NavalUnits.tsx          # Main units list/grid
│   ├── Groups.tsx              # Groups management
│   ├── Admin.tsx               # User management
│   └── Quiz.tsx                # Quiz mode
├── hooks/
│   └── useAuth.tsx             # Authentication context
├── services/
│   └── api.ts                  # Axios client with typed API methods
└── types/
    └── index.ts                # TypeScript definitions
```

**Note**: The Canvas Editor has both a monolithic component ([CanvasEditor.tsx](frontend/src/components/CanvasEditor.tsx)) and a modular structure ([CanvasEditor/](frontend/src/components/CanvasEditor/)). The modular version is the current implementation with separated concerns.

### Key Features Implementation

1. **Canvas Editor System** ([CanvasEditor.tsx](frontend/src/components/CanvasEditor.tsx))
   - Drag-and-drop visual editor for A4/PowerPoint layouts
   - Elements: logo, flag, silhouette, text, tables, fixed unit fields
   - Template system with format-only vs full-content application
   - Multiple canvas sizes: A4 (1123×794), A3, Presentation (1280×720)
   - State stored in `layout_config` JSON field in database

2. **Template System** ([TemplateManager.tsx](frontend/src/components/TemplateManager.tsx))
   - Predefined templates: Standard, Minimalist, Detailed, PowerPoint
   - Two application modes: "Apply" (replaces all) vs "Format" (preserves content)
   - Template states saved per unit-template combination
   - Templates API: `/api/templates` (CRUD operations)

3. **Group Hierarchy & Overrides** ([models/group.py](backend/models/group.py))
   - Groups can have subgroups via `parent_group_id`
   - Template overrides: `template_logo_path`, `template_flag_path`
   - Presentation config stored as JSON in `presentation_config`
   - Group memberships in separate table with many-to-many relationship

4. **Image Management**
   - Upload directories: `data/uploads/{silhouettes,logos,flags,general}/`
   - Static file serving via FastAPI StaticFiles at `/uploads`
   - Image paths stored as relative strings in database
   - CORS middleware for cross-origin image access

5. **Export System**
   - **PowerPoint**: [utils/powerpoint_export.py](backend/utils/powerpoint_export.py) - python-pptx with template selection
   - **PNG**: [utils/png_export.py](backend/utils/png_export.py) - Pillow rendering from canvas state
   - **PDF**: ReportLab (legacy, less used than PowerPoint now)
   - Group exports include all units with template overrides applied

### Authentication Flow

- JWT tokens with 30-minute expiration
- Token stored in localStorage and axios Authorization header
- User activation required by admin before first login
- Admin users have `is_admin=True` flag
- Protected routes use `ProtectedRoute` component checking auth context

## Common Development Tasks

### Adding a New API Endpoint

Endpoints are typically added **directly in simple_main.py**, not in separate api/ modules:

```python
# In backend/simple_main.py
@app.get("/api/your-endpoint")
def your_endpoint(db: SimpleDatabase = Depends(get_db_connection)):
    # Your logic here
    return {"data": "..."}
```

Then add to frontend [services/api.ts](frontend/src/services/api.ts):

```typescript
export const yourApi = {
  yourMethod: async (): Promise<YourType> => {
    const response = await api.get('/api/your-endpoint');
    return response.data;
  },
};
```

### Modifying the Canvas Editor

The canvas state is stored in `NavalUnit.layout_config` as JSON. Structure:
```typescript
interface CanvasElement {
  id: string;
  type: 'logo' | 'flag' | 'silhouette' | 'text' | 'table' | 'unit_name' | 'unit_class';
  x: number; y: number; width: number; height: number;
  content?: string;
  image?: string;
  tableData?: string[][];
  style?: { fontSize, color, backgroundColor, ... };
}
```

Canvas dimensions are set by template format in [TemplateManager.tsx](frontend/src/components/TemplateManager.tsx:4).

### Working with Templates

Templates are managed through `/api/templates` endpoints. Template state for a specific unit-template combination is saved separately via `/api/units/{id}/template-states/{templateId}`.

When applying a template:
- **Full application**: Replaces all canvas elements
- **Format only**: Preserves content elements (images, text), updates positions/styles

### Database Schema Changes

Since the app uses SimpleDatabase (not migrations), schema changes require:
1. Modify [app/simple_database.py](backend/app/simple_database.py) init_database() function
2. Delete `data/naval_units.db`
3. Restart backend (will recreate with new schema)
4. Run `python create_admin.py` to recreate admin user

## Important Notes

- **Port**: Backend runs on **8001**, not 8000 (different from docs in some files)
- **Entry point**: Use `simple_main.py`, not `main.py`
- **Database**: Custom wrapper, not SQLAlchemy ORM in production code
- **Data directory**: `data/` contains all user data and is git-ignored
- **CORS**: Configured for localhost:5173 and wildcard for OpenShift deployment
- **Image URLs**: Use `getImageUrl()` helper from `utils/imageUtils` in frontend
- **File uploads**: Max 50MB size limit set in simple_main.py

## Known Issues

1. **Python 3.13 compatibility**: SQLAlchemy models exist but aren't used in simple_main.py to avoid multiprocessing issues
2. **Auto-reload stability**: Windows batch scripts disable auto-reload for stability
3. **Template state persistence**: Each unit stores separate states for each template ID

## Configuration

### Backend Environment
```bash
# backend/.env (optional)
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./data/naval_units.db
```

### Frontend Environment
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8001
```

### Docker Deployment
Use [docker-compose.yml](docker-compose.yml) - configured for ports 8001 (backend) and 80 (frontend).

## Testing

No automated test suite currently exists. Manual testing via:
- API docs at http://localhost:8001/docs (Swagger UI)
- Frontend interaction testing
- `backend/test_template_states.py` for template state verification

## Additional Documentation

- **[FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)**: Comprehensive 1950-line guide covering React architecture, component patterns, Canvas Editor internals, hooks, state management, and troubleshooting
- **[README.md](README.md)**: General project overview and quick start guide
- **[CanvasEditor/README.md](frontend/src/components/CanvasEditor/README.md)**: Technical documentation for the modular Canvas Editor system

## Additional Components Not Listed Above

Recent additions include:
- **VersionManager.tsx**: Track and manage different versions of unit layouts
- **TemplateEditor.tsx**: Visual editor for creating/modifying templates
- **QuizConfiguration.tsx**: Configure quiz settings and question pools
- **GalleryManager.tsx** & **GalleryViewer.tsx**: Enhanced gallery functionality with ordering and zoom
- **UnitGalleryModal.tsx**: Modal interface for unit gallery management
