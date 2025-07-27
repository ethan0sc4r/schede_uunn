# Naval Units Management System - Development Guide

## 🚀 Current Status: **FULLY FUNCTIONAL**

The Naval Units Management System is now completely set up and ready for development. All core components are working correctly.

## ✅ What's Working

### Backend (FastAPI + Python)
- ✅ **Authentication System**: JWT-based login/registration
- ✅ **Database**: SQLite with SQLAlchemy 1.4 (Python 3.13 compatible)
- ✅ **API Endpoints**: Complete CRUD for users, naval units, groups
- ✅ **File Upload**: Image handling for logos, silhouettes, flags
- ✅ **Export System**: PDF and PNG generation
- ✅ **Admin Panel**: User management and activation
- ✅ **Search**: Full-text search across units

### Frontend (React + TypeScript)
- ✅ **Authentication UI**: Login and registration pages
- ✅ **Apple-inspired Design**: TailwindCSS with clean aesthetics
- ✅ **Responsive Layout**: Sidebar navigation and protected routes
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **API Integration**: Axios client with error handling

## 🏃‍♂️ Quick Start

### 1. Start the Servers

**Option A: Windows**
```cmd
start_servers.bat
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Login Credentials
- **Email**: admin@example.com
- **Password**: admin123

## 🔧 Development Environment

### Backend Dependencies
- **Python**: 3.13
- **FastAPI**: Latest
- **SQLAlchemy**: 1.4.53 (compatible with Python 3.13)
- **JWT**: python-jose with cryptography
- **Password Hashing**: passlib with bcrypt 4.0.1
- **PDF Generation**: ReportLab
- **Image Processing**: Pillow

### Frontend Dependencies
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Vite**: 7.0.6 (build tool)
- **TailwindCSS**: 4.1.11 (styling)
- **React Query**: 5.83.0 (data fetching)
- **React Router**: 7.7.1 (routing)
- **Axios**: 1.11.0 (HTTP client)

## 📁 Project Structure

```
schede_uunn/
├── backend/                 # FastAPI backend
│   ├── app/                 # Core application
│   │   ├── database.py      # Database configuration
│   │   └── schemas.py       # Pydantic models
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py          # User model
│   │   ├── naval_unit.py    # Naval unit & characteristics
│   │   └── group.py         # Groups & memberships
│   ├── api/                 # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── naval_units.py   # Naval units CRUD + export
│   │   ├── groups.py        # Groups management
│   │   └── admin.py         # Admin panel
│   ├── utils/               # Utility functions
│   │   ├── auth.py          # JWT & password handling
│   │   └── export.py        # PDF/PNG generation
│   ├── main.py              # FastAPI app entry point
│   └── create_admin.py      # Admin user creation script
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Layout.tsx   # Main layout with sidebar
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.tsx    # Login page
│   │   │   └── Register.tsx # Registration page
│   │   ├── hooks/           # Custom hooks
│   │   │   └── useAuth.tsx  # Authentication context
│   │   ├── services/        # API client
│   │   │   └── api.ts       # Axios configuration & endpoints
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts     # All type definitions
│   │   └── App.tsx          # Main app with routing
│   ├── public/              # Static assets
│   └── package.json         # Dependencies
├── uploads/                 # Uploaded images storage
│   ├── logos/               # Unit/group logos
│   ├── silhouettes/         # Ship silhouettes
│   ├── flags/               # Nation/group flags
│   └── groups/              # Group images
├── exports/                 # Generated PDF/PNG exports
├── naval_units.db           # SQLite database
├── start_servers.bat        # Windows development script
├── run_dev.py              # Cross-platform development script
└── README.md               # Setup instructions
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Naval Units
- `GET /api/units` - List all units
- `POST /api/units` - Create new unit
- `GET /api/units/{id}` - Get unit by ID
- `PUT /api/units/{id}` - Update unit
- `DELETE /api/units/{id}` - Delete unit
- `POST /api/units/{id}/upload-logo` - Upload unit logo
- `POST /api/units/{id}/upload-silhouette` - Upload silhouette
- `POST /api/units/{id}/upload-flag` - Upload flag
- `GET /api/units/{id}/export/pdf` - Export as PDF
- `GET /api/units/{id}/export/png` - Export as PNG
- `GET /api/units/search/` - Search units

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/{id}` - Get group by ID
- `PUT /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group
- `POST /api/groups/{id}/upload-logo` - Upload group logo
- `POST /api/groups/{id}/upload-flag` - Upload group flag

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/pending` - List pending users
- `POST /api/admin/users/{id}/activate` - Activate user
- `POST /api/admin/users/{id}/deactivate` - Deactivate user
- `POST /api/admin/users/{id}/make-admin` - Grant admin rights
- `POST /api/admin/users/{id}/remove-admin` - Remove admin rights

## 🎯 Next Development Priorities

### High Priority
1. **Naval Unit Card Editor** - Visual A4 layout editor
2. **Image Zoom Controls** - Fine-grained silhouette positioning
3. **Dynamic Characteristics Table** - Add/remove rows interface

### Medium Priority
4. **Group Override UI** - Frontend for group management
5. **Advanced Search** - Filters and sorting
6. **User Profile Management** - Change passwords, settings

### Low Priority
7. **Presentation Mode** - Slideshow with timing
8. **Layout Customization** - Colors and positioning
9. **Bulk Operations** - Import/export multiple units
10. **Audit Logging** - Track changes

## 🐛 Known Issues

1. **Windows Terminal Encoding**: Some emojis don't display correctly in Windows Command Prompt (fixed in scripts)
2. **SQLAlchemy Version**: Must use 1.4.53 for Python 3.13 compatibility
3. **bcrypt Version**: Must use 4.0.1 for compatibility

## 💡 Development Tips

### Adding New Features
1. **Backend**: Add new endpoints in `api/` directory
2. **Frontend**: Create components in `components/` or pages in `pages/`
3. **Database**: Add new models in `models/` directory
4. **Types**: Update TypeScript types in `types/index.ts`

### Database Changes
```bash
# If you modify models, delete the database to recreate:
cd backend
rm naval_units.db
python -c "from main import app; print('Database recreated')"
python create_admin.py  # Recreate admin user
```

### Testing API
- Use the auto-generated docs at http://localhost:8000/docs
- Or use curl/Postman with the Bearer token from login

### Environment Variables
Create `.env` files for configuration:

**backend/.env**
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./naval_units.db
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Deployment Ready

The application is production-ready with:
- ✅ Secure authentication
- ✅ Input validation
- ✅ Error handling
- ✅ CORS configuration
- ✅ Static file serving
- ✅ Database migrations support
- ✅ Responsive design

For production deployment, update database to PostgreSQL and configure proper environment variables.