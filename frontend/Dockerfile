# Dockerfile per il frontend React/Vite
# Stage 1: Build dell'applicazione React
FROM node:18-alpine as builder

WORKDIR /app

# Copia e installa le dipendenze
COPY package*.json ./
RUN npm ci --only=production

# Copia il codice sorgente e crea la build
COPY . .
RUN npm run build

# Stage 2: Produzione con Nginx
FROM nginx:alpine

# Rimuove configurazioni di default
RUN rm /etc/nginx/conf.d/default.conf

# Crea le directory temporanee in /tmp (con permessi più flessibili)
RUN mkdir -p /tmp/nginx-client-body \
             /tmp/nginx-proxy \
             /tmp/nginx-fastcgi \
             /tmp/nginx-uwsgi \
             /tmp/nginx-scgi && \
    chmod -R 777 /tmp/nginx-*

# Copia la configurazione nginx ottimizzata
COPY nginx.conf /etc/nginx/conf.d/

# Copia i file statici della build
COPY --from=builder /app/dist /usr/share/nginx/html

# Assicurati che nginx abbia i permessi sui file statici
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Crea un script di avvio personalizzato per gestire i permessi
RUN echo '#!/bin/sh' > /docker-entrypoint-custom.sh && \
    echo 'mkdir -p /tmp/nginx-client-body /tmp/nginx-proxy /tmp/nginx-fastcgi /tmp/nginx-uwsgi /tmp/nginx-scgi' >> /docker-entrypoint-custom.sh && \
    echo 'chmod -R 777 /tmp/nginx-*' >> /docker-entrypoint-custom.sh && \
    echo 'exec "$@"' >> /docker-entrypoint-custom.sh && \
    chmod +x /docker-entrypoint-custom.sh

# Esponi la porta 80
EXPOSE 80

# Usa lo script personalizzato come entrypoint
ENTRYPOINT ["/docker-entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]