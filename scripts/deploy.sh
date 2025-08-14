#!/bin/bash

# 🚀 Script de déploiement DATALYS Consulting App
# Usage: ./scripts/deploy.sh [environment]

set -e

# Variables
ENVIRONMENT=${1:-production}
SERVER_HOST="82.112.253.137"
DEPLOY_PATH="/var/www/datalys-app"
APP_NAME="datalys-app"
DOMAIN="applicationweb.datalysconsulting.com"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifications préalables
check_prerequisites() {
    log_info "🔍 Vérification des prérequis..."
    
    # Vérifier la connexion SSH
    if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$SERVER_HOST "echo 'SSH OK'" > /dev/null 2>&1; then
        log_error "❌ Impossible de se connecter au serveur $SERVER_HOST"
        exit 1
    fi
    
    log_success "✅ Connexion SSH établie"
}

# Build local
build_app() {
    log_info "🏗️ Build de l'application..."
    
    npm ci
    npm run build
    
    log_success "✅ Build terminé"
}

# Déploiement
deploy_app() {
    log_info "🚀 Déploiement vers $ENVIRONMENT..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    RELEASE_DIR="$DEPLOY_PATH/releases/$TIMESTAMP"
    
    # Créer les répertoires sur le serveur
    ssh root@$SERVER_HOST "
        mkdir -p $DEPLOY_PATH/releases
        mkdir -p $DEPLOY_PATH/shared/logs
        mkdir -p $RELEASE_DIR
    "
    
    # Synchroniser les fichiers
    log_info "📦 Synchronisation des fichiers..."
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.env*' \
        --exclude='logs' \
        ./ root@$SERVER_HOST:$RELEASE_DIR/
    
    # Installation des dépendances
    log_info "📋 Installation des dépendances..."
    ssh root@$SERVER_HOST "
        cd $RELEASE_DIR
        npm ci --only=production --ignore-scripts
        
        # Créer les liens symboliques
        ln -sf $DEPLOY_PATH/shared/logs logs
        ln -sf $DEPLOY_PATH/shared/.env.production .env.production
    "
    
    # Basculer vers la nouvelle version
    log_info "🔄 Activation de la nouvelle version..."
    ssh root@$SERVER_HOST "
        cd $DEPLOY_PATH
        ln -sfn releases/$TIMESTAMP current
        
        # Redémarrer PM2
        cd current
        pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
        pm2 save
    "
    
    # Nettoyage des anciennes versions
    log_info "🧹 Nettoyage des anciennes versions..."
    ssh root@$SERVER_HOST "
        cd $DEPLOY_PATH/releases
        ls -t | tail -n +6 | xargs -r rm -rf
    "
    
    log_success "✅ Déploiement terminé!"
}

# Test de santé
health_check() {
    log_info "🏥 Vérification de santé..."
    
    sleep 10
    
    if curl -f -s "https://$DOMAIN/" > /dev/null; then
        log_success "✅ Application accessible sur https://$DOMAIN/"
    else
        log_warning "⚠️  L'application pourrait ne pas être accessible"
    fi
    
    # Afficher le statut PM2
    log_info "📊 Statut PM2:"
    ssh root@$SERVER_HOST "pm2 list"
}

# Rollback
rollback() {
    log_info "🔄 Rollback vers la version précédente..."
    
    ssh root@$SERVER_HOST "
        cd $DEPLOY_PATH
        CURRENT=\$(readlink current)
        PREVIOUS=\$(ls -t releases/ | sed -n '2p')
        
        if [ -n \"\$PREVIOUS\" ]; then
            ln -sfn releases/\$PREVIOUS current
            cd current
            pm2 reload ecosystem.config.js --env production
            echo \"Rollback vers \$PREVIOUS effectué\"
        else
            echo \"Aucune version précédente trouvée\"
            exit 1
        fi
    "
    
    log_success "✅ Rollback effectué"
}

# Menu principal
main() {
    echo "🚀 DATALYS Consulting App - Déploiement"
    echo "=========================================="
    
    case ${1:-deploy} in
        "deploy")
            check_prerequisites
            build_app
            deploy_app
            health_check
            ;;
        "rollback")
            rollback
            health_check
            ;;
        "status")
            ssh root@$SERVER_HOST "pm2 list && pm2 logs $APP_NAME --lines 20"
            ;;
        "logs")
            ssh root@$SERVER_HOST "pm2 logs $APP_NAME"
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|logs}"
            exit 1
            ;;
    esac
}

# Exécution
main "$@"