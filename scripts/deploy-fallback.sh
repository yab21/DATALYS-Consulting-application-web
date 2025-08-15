#!/bin/bash

# Script de déploiement de secours pour DATALYS
# À utiliser si le déploiement GitHub Actions échoue

set -e

# Variables
SERVER_HOST="82.112.253.137"
DEPLOY_PATH="/var/www/datalys-app"
APP_NAME="datalys-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_PATH/releases/$TIMESTAMP"

echo "🚀 Déploiement de secours DATALYS - $TIMESTAMP"

# Créer les répertoires
echo "📁 Création des répertoires..."
ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "
  mkdir -p $RELEASE_DIR
  mkdir -p $DEPLOY_PATH/shared/logs
  mkdir -p $DEPLOY_PATH/shared/node_modules
"

# Build local si nécessaire
if [ ! -d ".next" ]; then
  echo "🏗️ Build de l'application..."
  npm run build
fi

# Upload des fichiers
echo "📤 Upload des fichiers..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='scripts' \
  ./ root@$SERVER_HOST:$RELEASE_DIR/

# Créer les liens symboliques
echo "🔗 Création des liens symboliques..."
ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "
  cd $RELEASE_DIR
  ln -sf $DEPLOY_PATH/shared/logs logs
  ln -sf $DEPLOY_PATH/shared/.env .env
"

# Installation des dépendances avec méthode robuste
echo "📋 Installation des dépendances..."
ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "
  cd $RELEASE_DIR
  
  # Copier le cache s'il existe
  if [ -d '$DEPLOY_PATH/shared/node_modules' ]; then
    echo 'Utilisation du cache node_modules...'
    cp -rf $DEPLOY_PATH/shared/node_modules ./
  fi
  
  # Installation avec gestion d'erreurs
  NODE_OPTIONS='--max_old_space_size=1024' npm ci --omit=dev --ignore-scripts --no-audit --no-fund 2>/dev/null || {
    echo 'npm ci failed, using npm install...'
    rm -rf node_modules package-lock.json
    NODE_OPTIONS='--max_old_space_size=1024' npm install --production --no-audit --no-fund --legacy-peer-deps
  }
  
  # Sauvegarder pour la prochaine fois
  rm -rf $DEPLOY_PATH/shared/node_modules
  cp -rf node_modules $DEPLOY_PATH/shared/
"

# Basculer vers la nouvelle version
echo "🔄 Basculement vers la nouvelle version..."
ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "
  cd $DEPLOY_PATH
  
  # Backup
  if [ -L current ]; then
    rm -f previous
    mv current previous
  fi
  
  # Nouveau lien
  ln -sf releases/$TIMESTAMP current
  
  # Restart PM2
  cd current
  pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
  pm2 save
"

# Nettoyage
echo "🧹 Nettoyage des anciennes versions..."
ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "
  cd $DEPLOY_PATH/releases
  ls -t | tail -n +6 | xargs -r rm -rf
"

# Health check
echo "✅ Vérification de santé..."
sleep 10
if curl -f https://applicationweb.datalysconsulting.com/ >/dev/null 2>&1; then
  echo "🎉 Déploiement réussi ! Application accessible."
else
  echo "⚠️ Application déployée mais health check échoué. Vérifiez manuellement."
fi

echo "✨ Déploiement de secours terminé !"