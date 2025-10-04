# 🚀 AVVIO RAPIDO - Copia e Incolla Questi Comandi

## Setup Iniziale (Solo la Prima Volta)

### 1. Installa Dipendenze Backend
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 -m pip install -r requirements.txt
```

### 2. Crea Admin User
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 create_admin.py
```

### 3. Dipendenze Frontend (✅ GIÀ FATTO!)
Frontend già installato con npm install.

---

## AVVIO APPLICAZIONE

### Apri 2 Terminali

#### TERMINAL 1 - Backend
Copia e incolla questo:
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 -m uvicorn simple_main:app --reload --host 0.0.0.0 --port 8001
```

Aspetta di vedere:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

#### TERMINAL 2 - Frontend
Copia e incolla questo:
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/frontend
npm run dev
```

Aspetta di vedere:
```
➜  Local:   http://localhost:5173/
```

---

## Apri il Browser

Vai a: **http://localhost:5173**

Login:
- Email: `admin@example.com`
- Password: `admin123`

---

## Per Fermare

In entrambi i terminal: **CTRL + C**

---

## Link Utili

- **App**: http://localhost:5173
- **API Docs**: http://localhost:8001/docs
- **Backend**: http://localhost:8001

---

## Tutto Fatto! ✅

Ora hai:
- ✅ Toast notifications moderne
- ✅ Performance ottimizzate
- ✅ Logger intelligente
- ✅ Canvas Editor refactorato (pronto all'uso)
