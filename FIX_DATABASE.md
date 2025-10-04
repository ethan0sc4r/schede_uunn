# 🔧 Fix Database - Sequenza Corretta

## Problema
Il database non esiste ancora. Devi prima avviare il backend che lo crea automaticamente.

## ✅ Soluzione - Segui Questa Sequenza

### 1️⃣ Avvia il Backend (Crea il Database)

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 -m uvicorn simple_main:app --host 0.0.0.0 --port 8001
```

**Aspetta di vedere**:
```
INFO:     Application startup complete.
```

✅ Ora il database è stato creato in `/Users/salagrafica/Documents/work/schede_uunn/data/naval_units.db`

### 2️⃣ Apri un NUOVO Terminal (Lascia il Backend Aperto!)

In un secondo terminal:

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 create_admin.py
```

Dovresti vedere:
```
✅ Admin user created successfully!
Email: admin@example.com
Password: admin123
```

### 3️⃣ Avvia il Frontend (Terzo Terminal)

```bash
cd /Users/salagrafica/Documents/work/schede_uunn/frontend
npm run dev
```

### 4️⃣ Apri il Browser

Vai a: **http://localhost:5173**

Login con:
- Email: `admin@example.com`
- Password: `admin123`

---

## 🎯 Riassunto Veloce

**3 Terminal aperti contemporaneamente**:

**Terminal 1** (Backend - lascia aperto):
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 -m uvicorn simple_main:app --host 0.0.0.0 --port 8001
```

**Terminal 2** (Crea admin - esegui una volta e chiudi):
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/backend
python3 create_admin.py
# Poi chiudi questo terminal con CTRL+C
```

**Terminal 3** (Frontend - lascia aperto):
```bash
cd /Users/salagrafica/Documents/work/schede_uunn/frontend
npm run dev
```

---

## 📋 Checklist

- [ ] Terminal 1: Backend avviato (porta 8001)
- [ ] Terminal 2: Admin creato (poi chiuso)
- [ ] Terminal 3: Frontend avviato (porta 5173)
- [ ] Browser: Aperto su http://localhost:5173
- [ ] Login: fatto con admin@example.com / admin123

---

## ❓ Problemi?

### "Address already in use"
Qualcosa è già in esecuzione su quella porta.

**Soluzione**:
```bash
# Ferma processo sulla porta 8001
lsof -ti:8001 | xargs kill -9

# Ferma processo sulla porta 5173
lsof -ti:5173 | xargs kill -9
```

Poi riprova.

---

**Ora prova di nuovo dalla sequenza 1️⃣!** 🚀
