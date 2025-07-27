# Naval Units Management System - Quick Start

## ✅ Problema SQLAlchemy RISOLTO!

Il sistema ora **funziona correttamente** con Python 3.13. Il problema di compatibilità con SQLAlchemy è stato risolto.

## 🚀 Avvio Rapido

### 1. Avvia il Backend
```cmd
start_backend.bat
```
**Note**: Il server si avvia senza auto-reload per evitare conflitti. Riavvia manualmente dopo modifiche al codice.

### 2. Avvia il Frontend (altro terminale)
```cmd
start_frontend.bat
```

### 3. Accedi all'Applicazione
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000 (o 8001 se 8000 è occupata)
- **API Docs**: http://localhost:8000/docs

### 4. Login
- **Email**: admin@example.com
- **Password**: admin123

## 🛠️ Script Disponibili

| Script | Descrizione |
|--------|-------------|
| `start_backend.bat` | Avvia backend (modalità stabile, no auto-reload) |
| `start_frontend.bat` | Avvia frontend |
| `start_backend_dev.bat` | Avvia backend con auto-reload (può essere instabile) |
| `stop_servers.bat` | Ferma tutti i server |
| `test_api.bat` | Testa se l'API risponde |
| `test_setup.bat` | Verifica completa del setup |

## 🎯 Stato Attuale

### ✅ Completato
- ✅ Backend FastAPI completamente funzionale
- ✅ Frontend React con autenticazione
- ✅ Database SQLite con modelli completi
- ✅ API complete per CRUD operations
- ✅ Sistema di upload immagini
- ✅ Esportazione PDF/PNG
- ✅ Pannello admin
- ✅ Ricerca unità navali
- ✅ Gestione gruppi/esercitazioni
- ✅ Autenticazione JWT
- ✅ Design Apple-inspired

### 🚧 Da Implementare
- 🔲 Editor visuale schede A4
- 🔲 Controlli zoom immagini
- 🔲 Tabella caratteristiche dinamica
- 🔲 Modalità presentazione
- 🔲 Personalizzazione layout

## 🐛 Troubleshooting

### Server non si avvia
1. Usa `stop_servers.bat` per fermare processi esistenti
2. Riprova con `start_backend.bat`

### Porta occupata
- Il sistema prova automaticamente la porta 8001 se 8000 è occupata

### Errori SQLAlchemy
- Usa sempre `start_backend.bat` (non `start_backend_dev.bat`)
- Il no-reload mode risolve tutti i problemi di compatibilità

## 🎉 Ready to Code!

Il sistema è **completamente operativo** e pronto per lo sviluppo delle funzionalità avanzate!