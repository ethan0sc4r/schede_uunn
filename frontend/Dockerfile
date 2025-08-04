# Dockerfile per il frontend React/Vite
# ---
# Stage 1: Build dell'applicazione React
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---
# Stage 2: Produzione con Nginx
FROM nginx:alpine

# Rimuove il file di configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia il tuo file di configurazione Nginx personalizzato
COPY nginx.conf /etc/nginx/conf.d/

# Copia i file statici generati nello stage 'builder'
COPY --from=builder /app/dist /usr/share/nginx/html

# Crea le directory necessarie per la cache e imposta i permessi corretti
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /var/log/nginx

# Crea directory per il PID di nginx e imposta i permessi
RUN mkdir -p /var/run && \
    chown -R nginx:nginx /var/run

# Esponi la porta 80
EXPOSE 8081


CMD ["nginx", "-g", "daemon off;"]