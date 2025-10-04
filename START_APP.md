# 🚀 Come Avviare l'Applicazione - Guida Completa

## Setup Iniziale (Solo la Prima Volta)

### 1. Installare le Dipendenze Backend

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
pip install -r requirements.txt
```

### 2. Installare le Dipendenze Frontend

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/frontend
npm install
```

### 3. Creare Admin User (Solo la Prima Volta)

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python create_admin.py
```

---

## Avvio Quotidiano

### Opzione A: Due Terminali Separati (RACCOMANDATO)

#### Terminal 1 - Backend
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python -m uvicorn simple_main:app --reload --host 0.0.0.0 --port 8001
```

**Dovresti vedere**:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Terminal 2 - Frontend
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/frontend
npm run dev
```

**Dovresti vedere**:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Opzione B: Script Automatico (Alternativa)

Crea questo file nella root del progetto:

**File**: `start.sh`
```bash
#!/bin/bash

# Avvia backend in background
cd backend
python -m uvicorn simple_main:app --reload --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..

# Aspetta che il backend sia pronto
echo "⏳ Avvio backend..."
sleep 3

# Avvia frontend
cd frontend
echo "⏳ Avvio frontend..."
npm run dev

# Quando chiudi frontend, chiudi anche backend
kill $BACKEND_PID
```

Rendilo eseguibile:
```bash
chmod +x start.sh
```

Poi esegui:
```bash
./start.sh
```

---

## Accesso all'Applicazione

Una volta avviati entrambi i server:

### Frontend
- **URL**: http://localhost:5173
- Apri il browser e vai a questo indirizzo

### Backend API
- **URL**: http://localhost:8001
- **Documentazione API**: http://localhost:8001/docs

### Login
- **Email**: admin@example.com
- **Password**: admin123

---

## Verifiche

### Backend Funzionante?
Apri: http://localhost:8001/docs
Dovresti vedere la documentazione Swagger API.

### Frontend Funzionante?
Apri: http://localhost:5173
Dovresti vedere la pagina di login.

### Database Creato?
Controlla che esista il file:
```bash
ls -la /Users/salagrafica/Documents/work/schede_uunn/data/naval_units.db
```

---

## Problemi Comuni

### Errore: "Port 8001 already in use"
Il backend è già in esecuzione. Trova e chiudi il processo:
```bash
lsof -ti:8001 | xargs kill -9
```

### Errore: "Port 5173 already in use"
Il frontend è già in esecuzione. Trova e chiudi:
```bash
lsof -ti:5173 | xargs kill -9
```

### Errore: "Module not found"
Reinstalla le dipendenze:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Errore: "Database not found"
Il database si crea automaticamente al primo avvio del backend.
Se manca, riavvia il backend.

---

## Fermare l'Applicazione

### Fermare Backend
Nel terminal del backend: **CTRL+C**

### Fermare Frontend
Nel terminal del frontend: **CTRL+C**

### Fermare Tutto (se usi script)
Nel terminal: **CTRL+C**

---

## Features Disponibili Dopo l'Avvio

✅ **Sistema Toast** - Feedback visivo moderno (niente più alert!)
✅ **Performance Ottimizzate** - Componenti memoizzati
✅ **Logger** - Console.log solo in development
✅ **Canvas Editor Refactorato** - Infrastruttura modulare pronta

### Nuovo Canvas Editor (In Preview)
I nuovi componenti sono disponibili in:
- `frontend/src/components/CanvasEditor/hooks/` - 4 custom hooks
- `frontend/src/components/CanvasEditor/components/` - 5 componenti UI
- `frontend/src/components/CanvasEditor/utils/` - Utilities

Per usarli, vedi: `frontend/src/components/CanvasEditor/README.md`

---

## Sviluppo

### Hot Reload Attivo
Entrambi backend e frontend hanno hot-reload:
- Modifica un file `.tsx` o `.py`
- Salva
- Le modifiche appaiono automaticamente nel browser

### Vedere i Log
- **Backend**: Nel terminal 1 (backend)
- **Frontend**: Nel terminal 2 (frontend) + Console browser (F12)

### Database SQLite
Puoi esplorare il database con:
```bash
sqlite3 data/naval_units.db
.tables
.schema naval_units
```

---

## Pro Tips

1. **Browser DevTools**: Apri con F12 per vedere:
   - Toast notifications in azione
   - Performance improvements
   - Network requests

2. **API Testing**: Usa http://localhost:8001/docs per testare API direttamente

3. **Git Status**: Prima di committare, verifica:
   ```bash
   git status
   ```

4. **Logs Puliti**: Con il nuovo logger, i log sono solo in development.
   In produzione saranno silenziosi.

---

## Quick Commands Reference

```bash
# Setup completo (prima volta)
cd backend && pip install -r requirements.txt && python create_admin.py && cd ../frontend && npm install && cd ..

# Avvio quotidiano
# Terminal 1:
cd backend && python -m uvicorn simple_main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2:
cd frontend && npm run dev

# Ferma tutto
# CTRL+C in entrambi i terminal
```

---

**Pronto! Buon lavoro! 🚀**
