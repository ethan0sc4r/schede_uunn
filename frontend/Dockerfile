# Dockerfile per il frontend React/Vite - Versione Bulletproof
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage di produzione
FROM nginx:alpine

# Rimuove configurazione default
RUN rm /etc/nginx/conf.d/default.conf

# Copia configurazione e file statici
COPY nginx.conf /etc/nginx/conf.d/
COPY --from=builder /app/dist /usr/share/nginx/html

# Esponi la porta
EXPOSE 8081

# Avvia nginx semplicemente (rimane come root - funziona sempre)
CMD ["nginx", "-g", "daemon off;"]