# Naval Units Management System

A complete web application for creating, managing, viewing, and exporting naval unit information sheets with an Apple-inspired design.

## 🚀 Features

- **User Management**: Registration, authentication, and admin approval system
- **Naval Unit Cards**: Create and edit A4-formatted information sheets
- **Image Management**: Upload logos, silhouettes, and flags with zoom controls
- **Groups/Exercises**: Organize units into groups with override capabilities
- **Export Options**: PDF and PNG export functionality
- **Search**: Find units by name, class, or nation
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
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 4. Run Development Servers

#### Option A: Use the automated script (Recommended)

```bash
python run_dev.py
```

#### Option B: Run manually

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

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

## 📄 License

This project is licensed under the MIT License.