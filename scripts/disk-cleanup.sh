#!/bin/bash
# Script de nettoyage automatique de l'espace disque

echo "🧹 NETTOYAGE AUTOMATIQUE ESPACE DISQUE"
echo "======================================"

# Fonction pour afficher l'espace disque
show_disk_usage() {
    echo "💾 Espace disque actuel :"
    df -h | grep -E "(Filesystem|/$|/var)"
    echo ""
}

echo "📊 État avant nettoyage :"
show_disk_usage

# 1. Nettoyer les anciens backups (garder seulement le plus récent)
echo "🗂️ Nettoyage des anciens backups..."
find /var/www -name "*_backup_*" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || echo "Pas d'anciens backups"

# 2. Nettoyer les logs PM2 volumineux
echo "📄 Nettoyage des logs PM2..."
if [ -d "/var/www/datalys-app-git/logs" ]; then
    for logfile in /var/www/datalys-app-git/logs/*.log; do
        if [ -f "$logfile" ] && [ $(wc -l < "$logfile" 2>/dev/null || echo 0) -gt 1000 ]; then
            echo "Nettoyage de $logfile ($(wc -l < "$logfile") lignes)"
            tail -500 "$logfile" > "$logfile.tmp" && mv "$logfile.tmp" "$logfile"
        fi
    done
fi

# 3. Nettoyer les logs système nginx
echo "🌐 Nettoyage des logs Nginx..."
if [ -f "/var/log/nginx/datalys-app.access.log" ] && [ $(wc -l < "/var/log/nginx/datalys-app.access.log" 2>/dev/null || echo 0) -gt 10000 ]; then
    tail -5000 "/var/log/nginx/datalys-app.access.log" > "/var/log/nginx/datalys-app.access.log.tmp"
    mv "/var/log/nginx/datalys-app.access.log.tmp" "/var/log/nginx/datalys-app.access.log"
fi

# 4. Nettoyer le cache npm global
echo "📦 Nettoyage cache npm..."
npm cache clean --force 2>/dev/null || echo "Cache npm nettoyé"

# 5. Nettoyer les fichiers temporaires système
echo "🗑️ Nettoyage fichiers temporaires..."
find /tmp -name "*datalys*" -mtime +1 -exec rm -rf {} + 2>/dev/null || true
find /tmp -name "deploy*" -mtime +1 -exec rm -rf {} + 2>/dev/null || true

# 6. Nettoyer les core dumps et crash reports
echo "💥 Nettoyage crash reports..."
find /var/crash -name "*" -mtime +7 -exec rm -f {} + 2>/dev/null || true
find / -name "core.*" -mtime +1 -exec rm -f {} + 2>/dev/null || true

echo ""
echo "📊 État après nettoyage :"
show_disk_usage

# 7. Alerter si l'espace disque est encore critique
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️ ALERTE : Utilisation disque à ${DISK_USAGE}% - Espace critique !"
    echo "   Considérez augmenter la taille du VPS ou nettoyer manuellement."
else
    echo "✅ Espace disque OK (${DISK_USAGE}% utilisé)"
fi

echo ""
echo "🎉 Nettoyage automatique terminé !"