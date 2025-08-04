# Dockerfile per il frontend React/Vite
# ---
# Stage 1: Build dell'applicazione React
# Utilizza un'immagine Node.js per installare le dipendenze e creare la build
FROM node:18-alpine as builder

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file del package per installare le dipendenze
COPY package*.json ./

# Installa le dipendenze di progetto
# 'npm ci' è più affidabile per le build in CI/CD rispetto a 'npm install'
RUN npm ci

# Copia il resto del codice sorgente nella directory di lavoro
COPY . .

# Esegue il build dell'applicazione per la produzione
# Questo crea la cartella 'dist' con i file statici
RUN npm run build

# ---
# Stage 2: Produzione con Nginx
# Utilizza un'immagine Nginx leggera per servire i file statici
FROM nginx:alpine

# Rimuove il file di configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia il tuo file di configurazione Nginx personalizzato
COPY nginx.conf /etc/nginx/conf.d/

# Copia i file statici generati nello stage 'builder' nella directory di Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Concede i permessi all'utente 'nginx' per accedere alla cache
# Questo risolve l'errore "Permission denied"
RUN chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Esponi la porta 80 del container
EXPOSE 80

# Comando per avviare Nginx in modalità foreground
CMD ["nginx", "-g", "daemon off;"]