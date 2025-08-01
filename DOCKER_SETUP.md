# Docker Setup - Container Unificato

Questo setup mette **Frontend (React)**, **Backend (FastAPI)** e **Nginx** in un singolo container Docker.

## Architettura del Container

```
Container (Port 80)
├── Nginx (Reverse Proxy + Static Files)
│   ├── Frontend (React build) → http://localhost:3000/
│   ├── API Proxy → http://localhost:3000/api/*
│   └── Static Files → http://localhost:3000/static/*
├── Backend (FastAPI) → http://127.0.0.1:8001
└── Database (SQLite) → /app/backend/data/naval_units.db
```

## Quick Start

### 1. Build e Start
```bash
# Build del container
docker-compose build

# Start dell'applicazione
docker-compose up -d

# Visualizza i logs
docker-compose logs -f
```

### 2. Accesso all'Applicazione
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/
- **Health Check**: http://localhost:3000/api/health

### 3. Gestione Container
```bash
# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Visualizza status
docker-compose ps
```

## Sviluppo e Debug

### Accesso al Container
```bash
# Accesso alla shell del container
docker-compose exec app bash

# Visualizza logs specifici
docker-compose logs app
docker-compose logs -f app  # Follow logs
```

### File Strutture nel Container
```
/app/
├── backend/              # Python FastAPI app
│   ├── simple_main.py   # Main application
│   ├── data/            # Database e uploads (MOUNTED)
│   └── requirements.txt
├── frontend/
│   └── dist/            # React build files
└── init.sh              # Startup script
```

### Modifica Configurazione Nginx
Il file di configurazione Nginx è embedded nel Dockerfile. Per modificarlo:

1. Modifica la sezione Nginx nel `Dockerfile`
2. Rebuild: `docker-compose build --no-cache`
3. Restart: `docker-compose up -d`

## Dati Persistenti

### Database e Uploads
I seguenti dati sono persistenti tramite volume mount:
- `./data/` → `/app/backend/data/` (Database SQLite + uploads)

### Backup del Database
```bash
# Backup
docker-compose exec app cp /app/backend/data/naval_units.db /tmp/backup.db
docker cp $(docker-compose ps -q app):/tmp/backup.db ./naval_units_backup.db

# Restore
docker cp ./naval_units_backup.db $(docker-compose ps -q app):/app/backend/data/naval_units.db
docker-compose restart app
```

## Environment Variables

### Variabili di Produzione
```yaml
environment:
  - NODE_ENV=production
  - PYTHONPATH=/app/backend
  - DATABASE_URL=sqlite:///app/backend/data/naval_units.db  # Opzionale
```

### Per Database Esterno (PostgreSQL)
Decommenta la sezione `db` nel `docker-compose.yml` e modifica il backend per usare PostgreSQL invece di SQLite.

## Troubleshooting

### Container Non Si Avvia
```bash
# Check logs
docker-compose logs app

# Check health
docker-compose exec app curl http://localhost/api/health

# Rebuild forzato
docker-compose build --no-cache --pull
```

### Frontend 404 Errors
Il frontend è configurato come SPA. Nginx instrada tutti i path non-API a `index.html`.

### API Non Risponde
```bash
# Check se backend è attivo
docker-compose exec app curl http://127.0.0.1:8001/api/health

# Check nginx config
docker-compose exec app nginx -t

# Check supervisor status
docker-compose exec app supervisorctl status
```

### Database Issues
```bash
# Check database file
docker-compose exec app ls -la /app/backend/data/

# Recreate database
docker-compose exec app rm /app/backend/data/naval_units.db
docker-compose restart app
```

## Build Personalizzato

### Solo il Container
```bash
docker build -t schede-uunn:latest .
docker run -p 3000:80 -v $(pwd)/data:/app/backend/data schede-uunn:latest
```

### Per Produzione
1. Modifica le variabili d'ambiente in `docker-compose.yml`
2. Configura un reverse proxy esterno (Traefik, Apache, ecc.)
3. Usa un database esterno (PostgreSQL, MySQL)
4. Configura SSL/TLS

## Performance Tips

- Il container usa multi-stage build per ottimizzare le dimensioni
- Static files del frontend sono serviti direttamente da Nginx
- Database SQLite è sufficiente per sviluppo, considera PostgreSQL per produzione
- I logs sono gestiti da Supervisor e disponibili in `/var/log/`

## Security Notes

- Il container espone solo la porta 80
- API backend è accessibile solo tramite Nginx proxy
- File uploads sono validati dal backend
- Considera l'uso di HTTPS in produzione