# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Installa serve globalmente
RUN npm install -g serve

# Copia i file della build
COPY --from=builder /app/dist ./dist

# Esponi la porta 8081
EXPOSE 8081

# Avvia serve con configurazione per SPA sulla porta 8081
CMD ["serve", "-s", "dist", "-l", "8081"]