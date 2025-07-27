# Naval Units Management System

A complete web application for creating, managing, viewing, and exporting naval unit information sheets with an Apple-inspired design.

## 🚀 Features

- **User Management**: Registration, authentication, and admin approval system
- **Naval Unit Cards**: Create and edit A4-formatted information sheets with advanced canvas editor
- **Image Management**: Upload logos, silhouettes, and flags with backend storage
- **Advanced Groups**: Organize units with subgroups, template overrides, and presentation modes
- **Presentation Mode**: Full-screen slideshow with single/grid layouts and auto-advance
- **Template System**: Group-level logo/flag overrides for presentations
- **Search & Filter**: Advanced search by name, class, nation, and creator
- **Notes System**: WYSIWYG editor for rich text notes on each unit
- **Export Options**: PDF and PNG export functionality
- **Admin Panel**: User management and activation controls
- **Responsive Design**: Apple-inspired UI with clean typography and spacing

## 🏗️ Architecture

### Backend (Python)
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: Database ORM with SQLite
- **JWT Authentication**: Secure token-based auth
- **ReportLab**: PDF generation
- **Pillow**: Image processing

### Frontend (React + TypeScript)
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **TailwindCSS**: Utility-first styling
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management

## 📋 Requirements

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd schede_uunn
```

### 2. Backend Setup

```bash
# Create virtual environment (se non già presente)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 4. Run Development Servers

#### Option A: Windows - Script Separati (Consigliato)

```cmd
# Apri due terminali separati:

# Terminal 1 - Backend:
start_backend.bat

# Terminal 2 - Frontend:
start_frontend.bat
```

#### Option B: Windows - Script Combinato

```cmd
start_servers.bat
```

#### Option C: Manuale

**Terminal 1 - Backend:**
```cmd
venv\Scripts\activate
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Data Structure

All application data is stored in the `data/` directory:

```
data/
├── naval_units.db          # Main SQLite database
├── uploads/               # User uploaded images
│   ├── logos/            # Unit logos
│   ├── silhouettes/      # Ship silhouettes  
│   └── flags/            # Nation flags
└── exports/              # Generated PDF/PNG exports
```

**Important**: The `data/` directory contains all user data and should be backed up regularly. It's excluded from git to prevent accidental commits of sensitive data.

## 👤 First Admin User

The system requires an admin user to activate new registrations. You'll need to:

1. Register a new account through the web interface
2. Manually activate it in the database or create an admin user directly

To create the first admin user manually:

```python
# In a Python shell with the backend environment activated
from backend.app.database import SessionLocal
from backend.models.user import User
from backend.utils.auth import get_password_hash

db = SessionLocal()

admin_user = User(
    email="admin@example.com",
    first_name="Admin",
    last_name="User",
    hashed_password=get_password_hash("admin123"),
    is_active=True,
    is_admin=True
)

db.add(admin_user)
db.commit()
db.close()
```

## 📁 Project Structure

```
schede_uunn/
├── backend/
│   ├── app/
│   │   ├── database.py      # Database configuration
│   │   └── schemas.py       # Pydantic models
│   ├── models/              # SQLAlchemy models
│   ├── api/                 # API endpoints
│   ├── utils/               # Utility functions
│   └── main.py              # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── uploads/                 # Uploaded images
├── static/                  # Static files
└── run_dev.py              # Development server launcher
```

## 🎯 Key Features Implementation Status

- ✅ User authentication and authorization
- ✅ Basic CRUD operations for naval units
- ✅ Image upload system
- ✅ PDF and PNG export
- ✅ Group management
- ✅ Search functionality
- ✅ Admin panel
- 🚧 Naval unit card editor (in progress)
- ⏳ Image zoom and positioning
- ⏳ Characteristics table editor
- ⏳ Presentation mode
- ⏳ Layout customization

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, update the backend `SECRET_KEY` and database configuration in `backend/app/database.py`.

## 🚀 Deployment

For production deployment:

1. Set up a proper database (PostgreSQL recommended)
2. Configure environment variables
3. Build the frontend: `cd frontend && npm run build`
4. Serve the built frontend and run the backend with a production WSGI server

## 📝 API Documentation

The API documentation is automatically generated and available at `/docs` when running the backend server.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🐛 Known Issues & Solutions

### SQLAlchemy + Python 3.13 Compatibility
- **Issue**: SQLAlchemy ha conflitti con Python 3.13 multiprocessing
- **Soluzione**: Usa `start_backend.bat` (senza auto-reload) per operazione stabile
- **Alternativa**: Usa `start_backend_dev.bat` per sviluppo (può essere instabile)

### Auto-reload Disabilitato
- Il server funziona senza auto-reload per evitare crash
- Riavvia il server manualmente dopo modifiche al codice

### Windows Terminal Encoding  
- Alcuni emoji non si visualizzano correttamente (risolto negli script)

## 📄 License

This project is licensed under the MIT License.