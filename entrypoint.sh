#!/bin/sh
# ================================
# Entrypoint.sh - Script de démarrage
# Simplifie l'initialisation et le démarrage du conteneur
# ================================

set -e

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Démarrage de l'application NestJS User Management"

# Vérification des variables d'environnement critiques
if [ -z "$MONGODB_URI" ]; then
    log "❌ ERREUR: MONGODB_URI n'est pas définie"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    log "❌ ERREUR: JWT_SECRET n'est pas définie"
    exit 1
fi

log "✅ Variables d'environnement vérifiées"

# Créer le dossier uploads s'il n'existe pas
mkdir -p /app/uploads/avatars
log "✅ Dossier uploads initialisé"

# Attendre que la base de données soit accessible (optionnel)
if [ "$WAIT_FOR_DB" = "true" ]; then
    log "⏳ Attente de la base de données..."
    sleep 10
fi

log "🎯 Démarrage de l'application sur le port ${PORT:-3000}"

# Démarrer l'application
exec "$@"
