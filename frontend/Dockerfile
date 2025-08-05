# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM caddy:alpine

# Copia i file della build
COPY --from=builder /app/dist /usr/share/caddy

# Crea il Caddyfile per SPA sulla porta 8081
RUN echo ':8081' > /etc/caddy/Caddyfile && \
    echo 'root * /usr/share/caddy' >> /etc/caddy/Caddyfile && \
    echo 'try_files {path} /index.html' >> /etc/caddy/Caddyfile && \
    echo 'file_server' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Gzip compression' >> /etc/caddy/Caddyfile && \
    echo 'encode gzip' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Cache headers for static assets' >> /etc/caddy/Caddyfile && \
    echo '@static {' >> /etc/caddy/Caddyfile && \
    echo '    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile && \
    echo 'header @static Cache-Control "public, max-age=31536000, immutable"' >> /etc/caddy/Caddyfile

EXPOSE 8081
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM caddy:alpine

# Copia i file della build
COPY --from=builder /app/dist /usr/share/caddy

# Crea il Caddyfile per SPA sulla porta 8081
RUN echo ':8081' > /etc/caddy/Caddyfile && \
    echo 'root * /usr/share/caddy' >> /etc/caddy/Caddyfile && \
    echo 'try_files {path} /index.html' >> /etc/caddy/Caddyfile && \
    echo 'file_server' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Gzip compression' >> /etc/caddy/Caddyfile && \
    echo 'encode gzip' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Cache headers for static assets' >> /etc/caddy/Caddyfile && \
    echo '@static {' >> /etc/caddy/Caddyfile && \
    echo '    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile && \
    echo 'header @static Cache-Control "public, max-age=31536000, immutable"' >> /etc/caddy/Caddyfile

EXPOSE 8081
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM caddy:alpine

# Copia i file della build
COPY --from=builder /app/dist /usr/share/caddy

# Crea il Caddyfile per SPA sulla porta 8081
RUN echo ':8081' > /etc/caddy/Caddyfile && \
    echo 'root * /usr/share/caddy' >> /etc/caddy/Caddyfile && \
    echo 'try_files {path} /index.html' >> /etc/caddy/Caddyfile && \
    echo 'file_server' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Gzip compression' >> /etc/caddy/Caddyfile && \
    echo 'encode gzip' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Cache headers for static assets' >> /etc/caddy/Caddyfile && \
    echo '@static {' >> /etc/caddy/Caddyfile && \
    echo '    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile && \
    echo 'header @static Cache-Control "public, max-age=31536000, immutable"' >> /etc/caddy/Caddyfile

EXPOSE 8081
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM caddy:alpine

# Copia i file della build
COPY --from=builder /app/dist /usr/share/caddy

# Crea il Caddyfile per SPA sulla porta 8081
RUN echo ':8081' > /etc/caddy/Caddyfile && \
    echo 'root * /usr/share/caddy' >> /etc/caddy/Caddyfile && \
    echo 'try_files {path} /index.html' >> /etc/caddy/Caddyfile && \
    echo 'file_server' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Gzip compression' >> /etc/caddy/Caddyfile && \
    echo 'encode gzip' >> /etc/caddy/Caddyfile && \
    echo '' >> /etc/caddy/Caddyfile && \
    echo '# Cache headers for static assets' >> /etc/caddy/Caddyfile && \
    echo '@static {' >> /etc/caddy/Caddyfile && \
    echo '    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile && \
    echo 'header @static Cache-Control "public, max-age=31536000, immutable"' >> /etc/caddy/Caddyfile

EXPOSE 8081
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]