# ================================
# Multi-stage Dockerfile pour NestJS
# ================================
# Stage 1: Build du projet (optimisé avec cache)
# Stage 2: Image de production légère

# Stage 1: Build Stage
FROM node:22-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./

# Installer les dépendances (cache Docker intelligent)
RUN npm ci --only=production && npm cache clean --force

# Copier les dépendances de développement pour le build
COPY package*.json ./
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine AS production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de package pour les dépendances de production
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier l'application buildée depuis le stage builder
COPY --from=builder /app/dist ./dist

# Créer le dossier uploads (au lieu de le copier)
RUN mkdir -p ./uploads/avatars

# Copier le script d'entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Changer le propriétaire des fichiers
RUN chown -R nestjs:nodejs /app

# Basculer vers l'utilisateur non-root
USER nestjs

# Exposer le port (défini dans .env - PORT=3000)
EXPOSE 3000

# Variables d'environnement pour la production
ENV NODE_ENV=production

# Point d'entrée de l'application
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main"]