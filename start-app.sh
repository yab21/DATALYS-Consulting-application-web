#!/bin/bash

# Script de démarrage alternatif pour DATALYS App
# Utilise PM2 avec configuration simplifiée

echo "🚀 Démarrage DATALYS App..."

# Vérifier si PM2 est disponible
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 n'est pas installé. Installation..."
    npm install -g pm2
fi

# Arrêter les processus existants
echo "🛑 Arrêt des processus existants..."
pm2 delete datalys-app 2>/dev/null || echo "Aucun processus à arrêter"

# Créer le répertoire de logs s'il n'existe pas
mkdir -p logs

# Démarrer l'application avec PM2
echo "⚡ Démarrage de l'application..."
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration PM2
pm2 save

# Afficher le statut
echo "📊 Statut de l'application:"
pm2 list

echo "✅ DATALYS App démarrée avec succès!"
echo "🌐 Application accessible sur: https://applicationweb.datalysconsulting.com"