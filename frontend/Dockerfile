# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de package
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Installer un serveur simple pour servir les fichiers
RUN npm install -g serve

# Copier les fichiers build depuis le stage builder
COPY --from=builder /app/dist ./dist

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Démarrer l'application
CMD ["serve", "-s", "dist", "-l", "3000"]
