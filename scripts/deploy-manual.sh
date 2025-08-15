#!/bin/bash

# 🚀 Script de Déploiement Manuel DATALYS Consulting App
# Remplace le déploiement automatique par un processus manuel complet

set -e

# Variables
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
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "package.json" ]; then
        log_error "❌ Ce script doit être exécuté depuis la racine du projet"
        exit 1
    fi
    
    # Vérifier la connexion SSH
    if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$SERVER_HOST "echo 'SSH OK'" > /dev/null 2>&1; then
        log_error "❌ Impossible de se connecter au serveur $SERVER_HOST"
        log_error "❌ Vérifiez votre clé SSH et la connectivité"
        exit 1
    fi
    
    log_success "✅ Connexion SSH établie"
}

# Build local
build_app() {
    log_info "🏗️ Build de l'application..."
    
    # Nettoyer les anciens builds
    if [ -d ".next" ]; then
        log_info "🧹 Nettoyage des anciens builds..."
        rm -rf .next
    fi
    
    # Installation des dépendances
    log_info "📦 Installation des dépendances..."
    npm ci
    
    # Build de l'application
    log_info "🔨 Build en cours..."
    npm run build
    
    # Vérification du build
    if [ ! -d ".next" ]; then
        log_error "❌ Le build a échoué - répertoire .next manquant"
        exit 1
    fi
    
    log_success "✅ Build terminé avec succès"
}

# Déploiement
deploy_app() {
    log_info "🚀 Déploiement vers le serveur..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    RELEASE_DIR="$DEPLOY_PATH/releases/$TIMESTAMP"
    
    log_info "📅 Version: $TIMESTAMP"
    
    # Créer les répertoires sur le serveur
    log_info "📁 Création des répertoires sur le serveur..."
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
        --exclude='.next/cache' \
        --exclude='scripts' \
        --exclude='README.md' \
        --exclude='GUIDE_DEPLOIEMENT_MANUEL.md' \
        ./ root@$SERVER_HOST:$RELEASE_DIR/
    
    log_success "✅ Fichiers synchronisés"
    
    # Installation des dépendances et configuration sur le serveur
    log_info "🔧 Configuration sur le serveur..."
    ssh root@$SERVER_HOST "
        cd $RELEASE_DIR
        
        # Installation des dépendances de production
        log_info '📋 Installation des dépendances...'
        npm ci --only=production --ignore-scripts
        
        # Créer les liens symboliques
        log_info '🔗 Création des liens symboliques...'
        ln -sf $DEPLOY_PATH/shared/logs logs
        ln -sf $DEPLOY_PATH/shared/env/.env.production .env.production
        
        # Vérifier que le fichier ecosystem.config.js existe
        if [ ! -f 'ecosystem.config.js' ]; then
            log_error '❌ Fichier ecosystem.config.js manquant sur le serveur'
            exit 1
        fi
    "
    
    # Basculer vers la nouvelle version
    log_info "🔄 Activation de la nouvelle version..."
    ssh root@$SERVER_HOST "
        cd $DEPLOY_PATH
        
        # Sauvegarder l'ancienne version si elle existe
        if [ -L 'current' ]; then
            OLD_VERSION=\$(readlink current)
            log_info '💾 Sauvegarde de l'\''ancienne version: '\$OLD_VERSION'
        fi
        
        # Basculer vers la nouvelle version
        ln -sfn releases/$TIMESTAMP current
        
        # Redémarrer l'application avec PM2
        cd current
        if pm2 list | grep -q '$APP_NAME'; then
            log_info '🔄 Redémarrage de l'\''application...'
            pm2 reload ecosystem.config.js --env production
        else
            log_info '🚀 Première démarrage de l'\''application...'
            pm2 start ecosystem.config.js --env production
        fi
        
        pm2 save
        
        log_success '✅ Application redémarrée avec succès'
    "
    
    # Nettoyage des anciennes versions
    log_info "🧹 Nettoyage des anciennes versions..."
    ssh root@$SERVER_HOST "
        cd $DEPLOY_PATH/releases
        # Garder seulement les 5 dernières versions
        ls -t | tail -n +6 | xargs -r rm -rf
        log_info '🧹 Nettoyage terminé'
    "
    
    log_success "✅ Déploiement terminé!"
}

# Test de santé
health_check() {
    log_info "🏥 Vérification de santé..."
    
    # Attendre que l'application démarre
    log_info "⏳ Attente du démarrage de l'application..."
    sleep 15
    
    # Test local sur le serveur
    log_info "🔍 Test local sur le serveur..."
    if ssh root@$SERVER_HOST "curl -f -s http://localhost:3000 > /dev/null"; then
        log_success "✅ Application accessible localement sur le serveur"
    else
        log_warning "⚠️  L'application pourrait ne pas être accessible localement"
    fi
    
    # Test externe
    log_info "🌐 Test externe..."
    if curl -f -s "https://$DOMAIN/" > /dev/null; then
        log_success "✅ Application accessible sur https://$DOMAIN/"
    else
        log_warning "⚠️  L'application pourrait ne pas être accessible externe"
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
        
        if [ ! -L 'current' ]; then
            log_error '❌ Aucune version active trouvée'
            exit 1
        fi
        
        CURRENT=\$(readlink current)
        PREVIOUS=\$(ls -t releases/ | sed -n '2p')
        
        if [ -n \"\$PREVIOUS\" ]; then
            log_info '🔄 Rollback vers '\$PREVIOUS'...'
            ln -sfn releases/\$PREVIOUS current
            
            cd current
            pm2 reload ecosystem.config.js --env production
            
            log_success '✅ Rollback vers '\$PREVIOUS' effectué'
        else
            log_error '❌ Aucune version précédente trouvée'
            exit 1
        fi
    "
    
    log_success "✅ Rollback effectué"
}

# Affichage du statut
show_status() {
    log_info "📊 Statut de l'application..."
    ssh root@$SERVER_HOST "
        echo '=== Statut PM2 ==='
        pm2 list
        
        echo ''
        echo '=== Versions disponibles ==='
        ls -la $DEPLOY_PATH/releases/
        
        echo ''
        echo '=== Version active ==='
        if [ -L $DEPLOY_PATH/current ]; then
            echo 'Current: '\$(readlink $DEPLOY_PATH/current)
        else
            echo 'Aucune version active'
        fi
        
        echo ''
        echo '=== Test de connectivité ==='
        curl -I http://localhost:3000 2>/dev/null | head -1 || echo 'Application non accessible'
    "
}

# Affichage des logs
show_logs() {
    log_info "📝 Affichage des logs..."
    ssh root@$SERVER_HOST "pm2 logs $APP_NAME --lines 50"
}

# Menu principal
main() {
    echo "🚀 DATALYS Consulting App - Déploiement Manuel"
    echo "=============================================="
    echo "Serveur: $SERVER_HOST"
    echo "Domaine: $DOMAIN"
    echo ""
    
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
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "build")
            check_prerequisites
            build_app
            ;;
        "sync")
            check_prerequisites
            deploy_app
            health_check
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|logs|build|sync}"
            echo ""
            echo "Commandes disponibles:"
            echo "  deploy   - Déploiement complet (build + sync + activation)"
            echo "  sync     - Synchronisation uniquement (sans build)"
            echo "  build    - Build local uniquement"
            echo "  rollback - Retour à la version précédente"
            echo "  status   - Afficher le statut de l'application"
            echo "  logs     - Afficher les logs PM2"
            exit 1
            ;;
    esac
}

# Exécution
main "$@" 