# Build stage
FROM node:18-alpine as builder
WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL=http://10.252.117.211:8001

# Set environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci
COPY . .
# Ensure .env is available during build for Vite to read
COPY .env .env
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Installa serve globalmente e curl per debug
RUN npm install -g serve
RUN apk add --no-cache curl

# Copia i file della build
COPY --from=builder /app/dist ./dist

# Esponi la porta 8081
EXPOSE 8081

# Avvia serve con configurazione per SPA sulla porta 8081
CMD ["serve", "-s", "dist", "-l", "8081"]