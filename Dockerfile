# Multi-stage Dockerfile che combina Frontend (React) + Backend (FastAPI) + Nginx
FROM node:18-alpine AS frontend-builder

# Set working directory per il frontend
WORKDIR /app/frontend

# Copia package files
COPY frontend/package*.json ./

# Installa dipendenze frontend
RUN npm ci --only=production

# Copia codice frontend
COPY frontend/ ./

# Build del frontend per produzione
RUN npm run build

# Stage finale: Python + Nginx
FROM python:3.11-slim

# Installa Nginx e dipendenze di sistema
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory per il backend
WORKDIR /app

# Copia requirements e installa dipendenze Python
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copia tutto il codice backend
COPY backend/ ./backend/

# Copia il frontend buildato da frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Crea directory per dati persistenti
RUN mkdir -p /app/backend/data/uploads/logos \
             /app/backend/data/uploads/silhouettes \
             /app/backend/data/uploads/flags \
             /app/backend/data/uploads/groups \
             /app/backend/data/temp \
             /app/backend/data/exports

# Copia configurazione Nginx
COPY <<EOF /etc/nginx/sites-available/default
server {
    listen 80;
    server_name localhost;

    # Serve frontend statico
    location / {
        root /app/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Headers per SPA
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Proxy per API backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Headers per CORS se necessario
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # Serve file statici dal backend (uploads, etc.)
    location /static/ {
        alias /app/backend/data/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Copia configurazione Supervisor per gestire i processi
COPY <<EOF /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
user=root

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx.err.log
stdout_logfile=/var/log/nginx.out.log

[program:backend]
command=python -m uvicorn simple_main:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/backend.err.log
stdout_logfile=/var/log/backend.out.log
environment=PYTHONPATH="/app/backend"
EOF

# Copia database se esiste (opzionale)
COPY backend/data/naval_units.db* /app/backend/data/ 2>/dev/null || true

# Crea un script di inizializzazione
COPY <<EOF /app/init.sh
#!/bin/bash

# Crea database se non exists
cd /app/backend
if [ ! -f "data/naval_units.db" ]; then
    echo "Creating initial database..."
    python -c "
from app.simple_database import init_database
init_database()
print('Database initialized successfully')
"
fi

# Avvia supervisor
exec supervisord -c /etc/supervisor/supervisord.conf
EOF

# Rendi eseguibile lo script
RUN chmod +x /app/init.sh

# Esponi la porta 80 per Nginx
EXPOSE 80

# Comando di avvio
CMD ["/app/init.sh"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1