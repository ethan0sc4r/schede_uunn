# REPORT DETTAGLIATO - COSA FA IL SOFTWARE

## 1. PANORAMICA GENERALE

Il **Naval Units Management System** è un'applicazione web completa per la gestione di schede informative di unità navali. Il sistema permette di creare, modificare e organizzare schede digitali di navi con un editor visuale avanzato, sistema di template personalizzabili ed esportazione in PowerPoint.

## 2. ARCHITETTURA TECNICA

### Backend (Python/FastAPI)
- **Server API**: FastAPI con documentazione OpenAPI automatica
- **Database**: SQLite (development) con supporto PostgreSQL (production)
- **Autenticazione**: JWT tokens con controllo ruoli (user/admin)
- **File Storage**: Sistema locale organizzato per tipologia (loghi, silhouette, bandiere)
- **Export Engine**: Generazione PowerPoint tramite python-pptx

### Frontend (React/TypeScript)
- **Framework**: React 19 con TypeScript e Vite
- **Styling**: TailwindCSS con design system ispirato ad Apple
- **State Management**: TanStack React Query per stato server
- **Canvas Editor**: Sistema di editing visuale custom
- **Routing**: React Router v7 con rotte protette

## 3. FUNZIONALITÀ PRINCIPALI

### A. GESTIONE UTENTI E AUTENTICAZIONE
```
- Registrazione utenti con approvazione admin obbligatoria
- Login con JWT token (durata 30 minuti)
- Gestione ruoli: User standard e Admin
- Cambio password per utenti e admin
- Dashboard admin per gestione utenti pendenti
```

### B. EDITOR CANVAS AVANZATO
```
ELEMENTI SUPPORTATI:
- Testo libero con formattazione
- Immagini (logo, silhouette nave, bandiere)
- Tabelle caratteristiche dinamiche
- Campi automatici (nome nave, classe)

FUNZIONALITÀ EDITOR:
- Drag & drop per posizionamento elementi
- Ridimensionamento con handle visuali
- Zoom e pan per navigazione
- Griglia di allineamento
- Undo/redo operations
- Anteprima in tempo reale
```

### C. SISTEMA TEMPLATE SOFISTICATO
```
GESTIONE TEMPLATE:
- Creazione template personalizzati
- Template predefiniti (A4, A3, Presentation)
- Controlli visibilità elementi (logo/bandiera/silhouette)
- Propagazione automatica modifiche a tutte le navi associate
- Stato template salvato per ogni nave

CANVAS CONFIGURABILI:
- Dimensioni: 1123x794 (A4 landscape), 794x1123 (A4 portrait), 1587x1123 (A3)
- Colori background personalizzabili
- Bordi configurabili (spessore, colore)
- Elementi posizionabili con coordinate pixel-perfect
```

### D. GESTIONE NAVI E CARATTERISTICHE
```
DATI NAVE:
- Nome e classe obbligatori
- Nazione di appartenenza
- Upload immagini (logo, silhouette, bandiera)
- Note testuali con editor WYSIWYG
- Tabella caratteristiche dinamica

CARATTERISTICHE:
- Coppie nome-valore personalizzabili
- Ordinamento tramite drag & drop
- Validazione dati in tempo reale
- Esportazione in tabelle formattate
```

### E. SISTEMA GRUPPI E ORGANIZZAZIONE
```
FUNZIONALITÀ GRUPPI:
- Creazione gruppi per organizzazione navi
- Assegnazione multipla navi a gruppi
- Template specifici per gruppo
- Esportazione PowerPoint di gruppo
- Gestione gerarchica delle informazioni
```

### F. ESPORTAZIONE AVANZATA
```
POWERPOINT EXPORT:
- Slide singole per ogni nave
- Layout basato su template selezionato
- Rendering immagini ad alta qualità
- Tabelle formattate automaticamente
- Presentazioni gruppo con slide titolo

ALTRE ESPORTAZIONI:
- PNG ad alta risoluzione
- Stampa diretta
- Condivisione link pubblici
```

## 4. WORKFLOW OPERATIVI

### Workflow Creazione Nave:
```
1. Login utente autenticato
2. Navigazione a "Nuova Nave"
3. Inserimento dati base (nome, classe, nazione)
4. Upload immagini opzionali
5. Selezione template iniziale
6. Personalizzazione layout con editor canvas
7. Aggiunta caratteristiche in tabella
8. Salvataggio automatico stato
```

### Workflow Gestione Template:
```
1. Accesso sezione "Gestione Template"
2. Selezione template esistente o creazione nuovo
3. Configurazione canvas (dimensioni, colori, bordi)
4. Posizionamento elementi con editor visuale
5. Configurazione visibilità elementi
6. Salvataggio template
7. Propagazione automatica a navi associate
```

### Workflow Esportazione:
```
1. Apertura nave in visualizzazione
2. Selezione tipo export (PNG/PowerPoint/Stampa)
3. Per PowerPoint: selezione template specifico
4. Generazione documento con rendering server-side
5. Download automatico file generato
```

## 5. MODELLO DATI

### Tabelle Database:
```sql
-- Utenti e autenticazione
users (id, email, first_name, last_name, hashed_password, is_active, is_admin)

-- Navi principali
naval_units (id, name, unit_class, nation, logo_path, silhouette_path, flag_path, 
             background_color, layout_config[JSON], current_template_id, notes)

-- Caratteristiche dinamiche
unit_characteristics (id, naval_unit_id, characteristic_name, characteristic_value, order_index)

-- Template riutilizzabili
templates (id, name, description, elements[JSON], canvas_width, canvas_height,
          canvas_background, logo_visible, flag_visible, silhouette_visible)

-- Stati template per nave
unit_template_states (id, unit_id, template_id, element_states[JSON], canvas_config[JSON])

-- Gruppi organizzativi
groups (id, name, description, logo_path, flag_path)
group_memberships (group_id, naval_unit_id)
```

## 6. API ENDPOINTS COMPLETA

### Autenticazione:
```
POST /api/auth/register - Registrazione nuovo utente
POST /api/auth/login - Login con JWT
GET /api/auth/me - Profilo utente corrente
POST /api/auth/change-password - Cambio password
```

### Gestione Navi:
```
GET /api/units - Lista navi (paginata)
GET /api/units/{id} - Dettaglio nave
POST /api/units - Creazione nave
PUT /api/units/{id} - Aggiornamento nave
DELETE /api/units/{id} - Eliminazione nave
GET /api/units/search - Ricerca navi
```

### Upload File:
```
POST /api/units/{id}/upload-logo - Upload logo nave
POST /api/units/{id}/upload-silhouette - Upload silhouette
POST /api/units/{id}/upload-flag - Upload bandiera
POST /api/upload-image - Upload generico immagine
```

### Template Management:
```
GET /api/templates - Lista template utente
GET /api/templates/{id} - Dettaglio template
POST /api/templates - Creazione template
PUT /api/templates/{id} - Aggiornamento template (con auto-propagazione)
DELETE /api/templates/{id} - Eliminazione template
GET /api/templates/{id}/units - Navi che usano template
```

### Export System:
```
POST /api/units/{id}/export/powerpoint - Export PowerPoint nave
POST /api/public/units/{id}/export/powerpoint - Export pubblico
GET /api/groups/{id}/export/powerpoint - Export gruppo
```

### Amministrazione:
```
GET /api/admin/users - Lista tutti utenti
GET /api/admin/users/pending - Utenti pendenti approvazione
POST /api/admin/users/{id}/activate - Attivazione utente
POST /api/admin/users/{id}/make-admin - Promozione admin
```

## 7. FUNZIONALITÀ AVANZATE IMPLEMENTATE

### A. Sistema Template Database-Driven
- Template salvati nel database invece di localStorage
- Associazione template-nave tramite foreign key
- Propagazione automatica modifiche template a tutte le navi associate
- Controlli visibilità elementi (logo, bandiera, silhouette) a livello database
- Stati template personalizzati per ogni nave

### B. Canvas Editor Professionale
- Zoom con trasformazione `transform-origin: top left`
- Sistema di visibilità elementi invece di eliminazione
- Debug logging per troubleshooting
- Background color personalizzabili per elementi
- Gestione immagini con conversione base64 → file paths

### C. Sistema Export Sofisticato
- PowerPoint con selezione template al momento dell'export
- Rendering server-side per qualità professionale
- Support per template custom nell'export
- Gestione endpoint pubblici e autenticati

### D. Architettura Database Robusta
- Relazioni foreign key appropriate
- Campi JSON per configurazioni flessibili
- Migration system per aggiornamenti schema
- Backup automatico configurazioni utente

## 8. TECNOLOGIE E LIBRERIE UTILIZZATE

### Backend Dependencies:
```
- FastAPI: Framework web moderno e veloce
- SQLAlchemy: ORM per database operations
- Pydantic: Validazione dati e serializzazione
- JWT: Autenticazione stateless
- python-pptx: Generazione PowerPoint
- Pillow: Manipolazione immagini
- bcrypt: Hashing password sicuro
```

### Frontend Dependencies:
```
- React 19: Framework UI reattivo
- TypeScript: Type safety
- TailwindCSS: Utility-first CSS
- TanStack React Query: State management server
- React Router v7: Routing avanzato
- Lucide React: Icon library
- React Hook Form: Form management
- Zod: Schema validation
```

## 9. DEPLOYMENT E INFRASTRUCTURE

### Containerizzazione:
```
- Docker multi-stage builds
- docker-compose per development
- Health checks configurati
- Volume persistence per database e uploads
```

### File Organization:
```
backend/
├── app/
│   ├── simple_database.py - Database operations
│   └── simple_main.py - FastAPI application
├── utils/
│   └── powerpoint_export.py - Export functionality
└── data/
    ├── naval_units.db - SQLite database
    └── uploads/ - Static files storage

frontend/
├── src/
│   ├── components/ - React components
│   ├── pages/ - Route components  
│   ├── services/ - API clients
│   ├── utils/ - Utility functions
│   └── types/ - TypeScript definitions
└── public/ - Static assets
```

## 10. SICUREZZA E PERFORMANCE

### Sicurezza Implementata:
- JWT token expiration (30 minuti)
- Role-based access control (user/admin)
- File upload validation (tipologia e dimensioni)
- CORS configuration per sicurezza cross-origin
- Password hashing con salt

### Performance Features:
- React Query caching per ridurre network requests
- Lazy loading componenti pesanti
- Pagination per liste grandi
- Image optimization e serving statico
- Database indexing per query frequenti

## CONCLUSIONI

Il Naval Units Management System è una piattaforma completa e professionale per la gestione di documentazione navale digitale. Combina un'interfaccia utente moderna e intuitiva con un backend robusto e scalabile, offrendo funzionalità avanzate come editing visuale, template system e export di qualità professionale.

Il sistema è production-ready e può gestire workflow complessi di creazione, modifica e distribuzione di schede navali, con particolare attenzione all'usabilità e alla flessibilità per diverse esigenze organizzative.