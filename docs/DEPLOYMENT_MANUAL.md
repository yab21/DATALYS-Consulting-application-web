# Guide de Déploiement Manuel - DATALYS Consulting

Ce guide détaille la procédure complète pour déployer manuellement l'application DATALYS Consulting sur un serveur VPS Hostinger.

## Prérequis

- Accès SSH au serveur VPS
- Node.js 18+ installé sur le serveur
- PM2 installé globalement
- Git installé sur le serveur

## 1. Connexion au Serveur

```bash
ssh root@82.112.253.137
```

## 2. Installation Initiale (Première fois uniquement)

### 2.1 Cloner le Repository

```bash
# Aller dans le répertoire web
cd /var/www

# Cloner le repository
git clone https://github.com/yab21/DATALYS-Consulting-application-web.git

# Renommer le dossier pour correspondre à la configuration PM2
mv DATALYS-Consulting-application-web datalys-app

# Aller dans le dossier de l'application
cd datalys-app
```

### 2.2 Configuration du Projet

```bash
# Changer vers la branche v2 (pour éviter le déploiement automatique)
git checkout v2

# Installer les dépendances
npm install

# Créer le dossier pour les logs PM2
mkdir -p logs

# Build de l'application
npm run build
```

### 2.3 Installation de PM2 (si nécessaire)

```bash
# Installer PM2 globalement
npm install -g pm2
```

### 2.4 Démarrage de l'Application

```bash
# Démarrer l'application avec PM2
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour redémarrer au boot du serveur
pm2 startup
```

## 3. Procédure de Mise à Jour (Déploiements suivants)

### 3.1 Arrêter l'Application

```bash
# Se connecter au serveur
ssh root@82.112.253.137

# Aller dans le répertoire de l'application
cd /var/www/datalys-app

# Arrêter l'application
pm2 stop datalys-app
```

### 3.2 Récupérer les Nouvelles Modifications

```bash
# Récupérer les dernières modifications
git fetch origin

# S'assurer d'être sur la branche v2
git checkout v2

# Mettre à jour le code
git pull origin v2
```

### 3.3 Rebuild et Redémarrage

```bash
# Installer les nouvelles dépendances (si nécessaire)
npm ci --only=production

# Rebuild de l'application
npm run build

# Redémarrer l'application
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration
pm2 save
```

## 4. Commandes de Vérification

### 4.1 Vérifier le Statut de l'Application

```bash
# Voir le statut de toutes les applications PM2
pm2 status

# Voir les logs en temps réel
pm2 logs datalys-app

# Voir les logs d'erreur uniquement
pm2 logs datalys-app --err

# Voir les dernières lignes des logs
pm2 logs datalys-app --lines 50
```

### 4.2 Test de Connectivité

```bash
# Vérifier que l'application répond
curl -I http://localhost:3000

# Ou tester le port configuré dans package.json
curl -I http://localhost:3001
```

## 5. Commandes Utiles PM2

```bash
# Redémarrer l'application
pm2 restart datalys-app

# Recharger l'application (zero-downtime)
pm2 reload datalys-app

# Arrêter l'application
pm2 stop datalys-app

# Supprimer l'application de PM2
pm2 delete datalys-app

# Voir les métriques en temps réel
pm2 monit

# Lister toutes les applications
pm2 list
```

## 6. Configuration des Ports

- **Port PM2 (ecosystem.config.js)**: 3000
- **Port Package.json (server.js)**: 3001
- **Serveur custom**: Utilise `server.js` avec le script `npm start`

## 7. Structure des Fichiers Importants

```
/var/www/datalys-app/
├── ecosystem.config.js    # Configuration PM2
├── package.json          # Scripts et dépendances
├── server.js            # Serveur custom
├── logs/               # Logs PM2
├── src/               # Code source
└── .env              # Variables d'environnement
```

## 8. Configuration Nginx

### 8.1 Installation de Nginx

```bash
# Installer Nginx
apt install -y nginx

# Démarrer et activer Nginx
systemctl start nginx
systemctl enable nginx
```

### 8.2 Configuration du site

Créer le fichier de configuration Nginx :

```bash
# Créer la configuration du site
nano /etc/nginx/sites-available/datalys-app
```

Contenu du fichier `/etc/nginx/sites-available/datalys-app` :

```nginx
server {
    listen 80;
    server_name applicationweb.datalysconsulting.com www.applicationweb.datalysconsulting.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name applicationweb.datalysconsulting.com www.applicationweb.datalysconsulting.com;

    # SSL sera configuré par Certbot

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        proxy_pass http://127.0.0.1:3000;
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Login rate limiting
    location /connexion {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/datalys-app.access.log;
    error_log /var/log/nginx/datalys-app.error.log;
}
```

### 8.3 Activation du site

```bash
# Activer le site
ln -sf /etc/nginx/sites-available/datalys-app /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

## 9. Configuration SSL avec Let's Encrypt

### 9.1 Installation de Certbot

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtention du certificat SSL

```bash
# Obtenir le certificat SSL pour le domaine
certbot --nginx -d applicationweb.datalysconsulting.com -d www.applicationweb.datalysconsulting.com --non-interactive --agree-tos --email admin@datalysconsulting.com
```

### 9.3 Renouvellement automatique

```bash
# Ajouter le renouvellement automatique au cron
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Vérifier le cron
crontab -l
```

## 10. Configuration du Firewall

```bash
# Activer le firewall
ufw --force enable

# Autoriser SSH
ufw allow ssh

# Autoriser Nginx (HTTP et HTTPS)
ufw allow 'Nginx Full'

# Vérifier le statut
ufw status
```

## 11. Outils de Monitoring

### 11.1 Installation des outils système

```bash
# Installer les outils de monitoring
apt install -y htop iotop nethogs

# Installer le plugin de rotation des logs PM2
pm2 install pm2-logrotate
```

### 11.2 Commandes de monitoring

```bash
# Monitoring en temps réel avec PM2
pm2 monit

# Voir l'utilisation des ressources
htop

# Monitoring réseau
nethogs

# Voir les logs Nginx
tail -f /var/log/nginx/datalys-app.access.log
tail -f /var/log/nginx/datalys-app.error.log
```

## 12. Variables d'Environnement

### 12.1 Configuration du fichier .env

```bash
# Créer le fichier .env dans le répertoire de l'application
nano /var/www/datalys-app/.env
```

Contenu du fichier `.env` :

```bash
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
# Ajoutez vos autres variables d'environnement ici
```

### 12.2 Sécurisation du fichier

```bash
# Sécuriser les permissions
chmod 600 /var/www/datalys-app/.env
chown www-data:www-data /var/www/datalys-app/.env
```

## 13. Script d'Installation Automatique

Pour automatiser l'installation complète, vous pouvez utiliser le script `server-setup.sh` :

```bash
# Rendre le script exécutable
chmod +x server-setup.sh

# Exécuter le script
./server-setup.sh
```

## 14. Troubleshooting

### Application ne démarre pas

```bash
# Vérifier les logs d'erreur
pm2 logs datalys-app --err

# Vérifier la configuration
pm2 describe datalys-app
```

### Port déjà utilisé

```bash
# Voir quel processus utilise le port
netstat -tulpn | grep :3000
# ou
lsof -i :3000

# Tuer le processus si nécessaire
kill -9 [PID]
```

### Problèmes de mémoire

```bash
# Augmenter la limite mémoire dans ecosystem.config.js
# max_memory_restart: "2G"

# Redémarrer avec la nouvelle configuration
pm2 restart ecosystem.config.js --env production
```

## 9. Sauvegarde et Rollback

### Création d'une sauvegarde avant déploiement

```bash
# Créer une branche de sauvegarde
git branch backup-$(date +%Y%m%d-%H%M%S)

# Ou créer un tag
git tag backup-$(date +%Y%m%d-%H%M%S)
```

### Rollback en cas de problème

```bash
# Revenir au commit précédent
git reset --hard HEAD~1

# Ou revenir à un tag/branche spécifique
git checkout backup-YYYYMMDD-HHMMSS

# Rebuild et redémarrer
npm run build
pm2 restart datalys-app
```

---

**Note**: Ce guide utilise la branche `v2` pour éviter les déploiements automatiques. Assurez-vous toujours d'être sur cette branche lors des déploiements manuels.
