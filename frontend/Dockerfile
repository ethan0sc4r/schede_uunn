# Dockerfile per il frontend React/Vite - Versione Bulletproof
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage di produzione
FROM nginx:alpine

# Crea le directory temporanee in /tmp con i permessi giusti
RUN mkdir -p /tmp/nginx-cache /tmp/nginx-client /tmp/nginx-proxy /tmp/nginx-fastcgi /tmp/nginx-uwsgi /tmp/nginx-scgi && \
    chmod -R 777 /tmp/nginx-*

# Rimuove configurazione default
RUN rm /etc/nginx/conf.d/default.conf

# Crea una configurazione nginx principale personalizzata che evita i problemi di cache
RUN echo 'user nginx;' > /etc/nginx/nginx.conf && \
    echo 'worker_processes auto;' >> /etc/nginx/nginx.conf && \
    echo 'error_log /var/log/nginx/error.log warn;' >> /etc/nginx/nginx.conf && \
    echo 'pid /var/run/nginx.pid;' >> /etc/nginx/nginx.conf && \
    echo 'events { worker_connections 1024; }' >> /etc/nginx/nginx.conf && \
    echo 'http {' >> /etc/nginx/nginx.conf && \
    echo '    include /etc/nginx/mime.types;' >> /etc/nginx/nginx.conf && \
    echo '    default_type application/octet-stream;' >> /etc/nginx/nginx.conf && \
    echo '    sendfile on;' >> /etc/nginx/nginx.conf && \
    echo '    keepalive_timeout 65;' >> /etc/nginx/nginx.conf && \
    echo '    client_body_temp_path /tmp/nginx-client;' >> /etc/nginx/nginx.conf && \
    echo '    proxy_temp_path /tmp/nginx-proxy;' >> /etc/nginx/nginx.conf && \
    echo '    fastcgi_temp_path /tmp/nginx-fastcgi;' >> /etc/nginx/nginx.conf && \
    echo '    uwsgi_temp_path /tmp/nginx-uwsgi;' >> /etc/nginx/nginx.conf && \
    echo '    scgi_temp_path /tmp/nginx-scgi;' >> /etc/nginx/nginx.conf && \
    echo '    include /etc/nginx/conf.d/*.conf;' >> /etc/nginx/nginx.conf && \
    echo '}' >> /etc/nginx/nginx.conf

# Copia configurazione e file statici
COPY nginx.conf /etc/nginx/conf.d/
COPY --from=builder /app/dist /usr/share/nginx/html

# Esponi la porta
EXPOSE 8081

# Avvia nginx
CMD ["nginx", "-g", "daemon off;"]