# Dockerfile per il frontend React/Vite
FROM node:18-alpine as builder

# Imposta la directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm ci

# Copia il codice sorgente
COPY . .

# Build dell'applicazione per la produzione
RUN npm run build

# Stage di produzione con Nginx
FROM nginx:alpine

# Rimuovi la configurazione predefinita di nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia la configurazione personalizzata di nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copia i file build nella directory di nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Concede i permessi all'utente 'nginx' per accedere alla cache
RUN chown -R nginx:nginx /var/cache/nginx

# Esponi la porta 80
EXPOSE 80

# Avvia nginx
CMD ["nginx", "-g", "daemon off;"]