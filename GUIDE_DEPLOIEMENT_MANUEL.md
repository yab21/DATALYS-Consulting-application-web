# 🚀 Guide de Déploiement Manuel Next.js avec PM2 et Nginx

## DATALYS Consulting Application Web

> **⚠️ IMPORTANT** : Ce guide remplace le déploiement automatique par un processus manuel complet.

---

## 📋 **Prérequis**

### **Sur votre machine locale :**

- ✅ Node.js 18+ et npm
- ✅ Git configuré
- ✅ Clé SSH configurée pour le serveur
- ✅ Accès root au serveur VPS

### **Sur le serveur VPS (82.112.253.137) :**

- ✅ Ubuntu/Debian
- ✅ Accès root
- ✅ Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) ouverts

---

## 🛠️ **Étape 1 : Configuration Initiale du Serveur**

### **1.1 Connexion au serveur**

```bash
ssh root@82.112.253.137
```

### **1.2 Mise à jour du système**

```bash
apt update && apt upgrade -y
```

### **1.3 Installation des dépendances système**

```bash
# Installation des packages essentiels
apt install -y curl wget git unzip software-properties-common

# Installation de Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Vérification des versions
node --version  # Doit afficher v18.x.x
npm --version   # Doit afficher 9.x.x ou plus
```

### **1.4 Installation de PM2**

```bash
npm install -g pm2
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root
```

### **1.5 Installation de Nginx**

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### **1.6 Installation de Certbot pour SSL**

```bash
apt install -y certbot python3-certbot-nginx
```

---

## 📁 **Étape 2 : Structure des Répertoires**

### **2.1 Création de la structure**

```bash
# Créer la structure de déploiement
mkdir -p /var/www/datalys-app/{releases,shared/{logs,uploads,env}}
mkdir -p /var/log/nginx

# Définir les permissions
chown -R www-data:www-data /var/www/datalys-app
chmod -R 755 /var/www/datalys-app
```

### **2.2 Configuration des variables d'environnement**

```bash
# Créer le fichier .env de production
cat > /var/www/datalys-app/shared/env/.env.production << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
# Ajoutez vos variables spécifiques ici
# DATABASE_URL=...
# API_KEY=...
# etc.
EOF

# Sécuriser le fichier
chmod 600 /var/www/datalys-app/shared/env/.env.production
chown www-data:www-data /var/www/datalys-app/shared/env/.env.production
```

---

## ⚙️ **Étape 3 : Configuration PM2**

### **3.1 Créer le fichier ecosystem.config.js**

```bash
cat > /var/www/datalys-app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'datalys-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/datalys-app/current',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/datalys-app/shared/logs/pm2-error.log',
    out_file: '/var/www/datalys-app/shared/logs/pm2-out.log',
    log_file: '/var/www/datalys-app/shared/logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
EOF
```

### **3.2 Configuration des logs PM2**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🌐 **Étape 4 : Configuration Nginx**

### **4.1 Créer la configuration du site**

```bash
cat > /etc/nginx/sites-available/datalys-app << 'EOF'
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name applicationweb.datalysconsulting.com www.applicationweb.datalysconsulting.com;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name applicationweb.datalysconsulting.com www.applicationweb.datalysconsulting.com;

    # SSL sera configuré par Certbot

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Static files avec cache optimisé
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        proxy_pass http://127.0.0.1:3000;
    }

    # API routes avec rate limiting
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

    # Login avec rate limiting strict
    location /connexion {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Application principale
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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Logs
    access_log /var/log/nginx/datalys-app.access.log;
    error_log /var/log/nginx/datalys-app.error.log;
}
EOF
```

### **4.2 Activer le site**

```bash
# Désactiver le site par défaut
rm -f /etc/nginx/sites-enabled/default

# Activer notre site
ln -sf /etc/nginx/sites-available/datalys-app /etc/nginx/sites-enabled/

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

---

## 🔒 **Étape 5 : Configuration SSL**

### **5.1 Obtenir le certificat SSL**

```bash
certbot --nginx -d applicationweb.datalysconsulting.com --non-interactive --agree-tos --email admin@datalysconsulting.com
```

### **5.2 Renouvellement automatique**

```bash
# Ajouter au crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

---

## 🛡️ **Étape 6 : Configuration du Firewall**

```bash
# Activer UFW
ufw --force enable

# Règles de base
ufw allow ssh
ufw allow 'Nginx Full'

# Vérifier le statut
ufw status
```

---

## 🚀 **Étape 7 : Déploiement Manuel**

### **7.1 Depuis votre machine locale - Build de l'application**

```bash
# Dans le répertoire de votre projet
npm ci
npm run build

# Vérifier que le build est réussi
ls -la .next/
```

### **7.2 Synchronisation avec le serveur**

```bash
# Créer un timestamp pour la nouvelle version
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="/var/www/datalys-app/releases/$TIMESTAMP"

# Synchroniser les fichiers (exclure les fichiers inutiles)
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='logs' \
  --exclude='.next/cache' \
  ./ root@82.112.253.137:$RELEASE_DIR/
```

### **7.3 Installation des dépendances sur le serveur**

```bash
# Se connecter au serveur
ssh root@82.112.253.137

# Aller dans le répertoire de la nouvelle version
cd /var/www/datalys-app/releases/$TIMESTAMP

# Installer les dépendances de production
npm ci --only=production --ignore-scripts

# Créer les liens symboliques
ln -sf /var/www/datalys-app/shared/logs logs
ln -sf /var/www/datalys-app/shared/env/.env.production .env.production
```

### **7.4 Activation de la nouvelle version**

```bash
# Basculer vers la nouvelle version
cd /var/www/datalys-app
ln -sfn releases/$TIMESTAMP current

# Redémarrer l'application avec PM2
cd current
pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
pm2 save
```

### **7.5 Nettoyage des anciennes versions**

```bash
# Garder seulement les 5 dernières versions
cd /var/www/datalys-app/releases
ls -t | tail -n +6 | xargs -r rm -rf
```

---

## ✅ **Étape 8 : Vérification du Déploiement**

### **8.1 Vérifier le statut PM2**

```bash
pm2 list
pm2 logs datalys-app --lines 20
```

### **8.2 Vérifier Nginx**

```bash
systemctl status nginx
nginx -t
```

### **8.3 Tester l'application**

```bash
# Test local sur le serveur
curl -I http://localhost:3000

# Test externe
curl -I https://applicationweb.datalysconsulting.com
```

### **8.4 Vérifier les logs**

```bash
# Logs PM2
pm2 logs datalys-app

# Logs Nginx
tail -f /var/log/nginx/datalys-app.access.log
tail -f /var/log/nginx/datalys-app.error.log
```

---

## 🔄 **Étape 9 : Rollback en cas de problème**

### **9.1 Rollback automatique**

```bash
cd /var/www/datalys-app
CURRENT=$(readlink current)
PREVIOUS=$(ls -t releases/ | sed -n '2p')

if [ -n "$PREVIOUS" ]; then
    ln -sfn releases/$PREVIOUS current
    cd current
    pm2 reload ecosystem.config.js --env production
    echo "Rollback vers $PREVIOUS effectué"
else
    echo "Aucune version précédente trouvée"
    exit 1
fi
```

### **9.2 Rollback manuel**

```bash
# Lister les versions disponibles
ls -la /var/www/datalys-app/releases/

# Basculer vers une version spécifique
cd /var/www/datalys-app
ln -sfn releases/20241201_143022 current
cd current
pm2 reload ecosystem.config.js --env production
```

---

## 📊 **Étape 10 : Monitoring et Maintenance**

### **10.1 Commandes utiles PM2**

```bash
# Statut général
pm2 list

# Logs en temps réel
pm2 logs datalys-app

# Redémarrer l'application
pm2 restart datalys-app

# Reload (zero-downtime)
pm2 reload datalys-app

# Statistiques
pm2 monit
```

### **10.2 Monitoring système**

```bash
# Installation d'outils de monitoring
apt install -y htop iotop nethogs

# Vérification des ressources
htop
df -h
free -h
```

### **10.3 Logs et rotation**

```bash
# Configuration de la rotation des logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🚨 **Dépannage Courant**

### **Problème : Application ne démarre pas**

```bash
# Vérifier les logs PM2
pm2 logs datalys-app

# Vérifier les variables d'environnement
cat /var/www/datalys-app/current/.env.production

# Vérifier les permissions
ls -la /var/www/datalys-app/current/
```

### **Problème : Nginx ne fonctionne pas**

```bash
# Vérifier la configuration
nginx -t

# Vérifier le statut
systemctl status nginx

# Vérifier les logs
tail -f /var/log/nginx/error.log
```

### **Problème : SSL expiré**

```bash
# Renouveler manuellement
certbot renew

# Vérifier l'expiration
certbot certificates
```

---

## 📝 **Script de Déploiement Automatisé (Optionnel)**

Si vous voulez simplifier le processus, vous pouvez créer un script local :

```bash
#!/bin/bash
# deploy-manual.sh

set -e

SERVER_HOST="82.112.253.137"
DEPLOY_PATH="/var/www/datalys-app"

echo "🚀 Déploiement manuel DATALYS App..."

# Build local
echo "📦 Build de l'application..."
npm ci
npm run build

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_PATH/releases/$TIMESTAMP"

# Synchronisation
echo "📤 Synchronisation avec le serveur..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='logs' \
  --exclude='.next/cache' \
  ./ root@$SERVER_HOST:$RELEASE_DIR/

# Déploiement sur le serveur
echo "🔧 Finalisation sur le serveur..."
ssh root@$SERVER_HOST "
    cd $RELEASE_DIR
    npm ci --only=production --ignore-scripts
    ln -sf $DEPLOY_PATH/shared/logs logs
    ln -sf $DEPLOY_PATH/shared/env/.env.production .env.production

    cd $DEPLOY_PATH
    ln -sfn releases/$TIMESTAMP current

    cd current
    pm2 reload ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
    pm2 save

    # Nettoyage
    cd $DEPLOY_PATH/releases
    ls -t | tail -n +6 | xargs -r rm -rf
"

echo "✅ Déploiement terminé!"
echo "🔗 URL: https://applicationweb.datalysconsulting.com"
```

---

## 🎯 **Résumé des Commandes Essentielles**

```bash
# Déploiement complet
./deploy-manual.sh

# Vérification rapide
ssh root@82.112.253.137 "pm2 list && curl -I http://localhost:3000"

# Rollback
ssh root@82.112.253.137 "cd /var/www/datalys-app && ls -t releases/ | head -2 | tail -1 | xargs -I {} ln -sfn releases/{} current && cd current && pm2 reload ecosystem.config.js --env production"
```

---

## 📞 **Support et Maintenance**

- **Logs PM2** : `pm2 logs datalys-app`
- **Logs Nginx** : `tail -f /var/log/nginx/datalys-app.error.log`
- **Statut système** : `htop`, `df -h`, `free -h`
- **Monitoring PM2** : `pm2 monit`

---

**🎉 Félicitations ! Votre application Next.js est maintenant déployée manuellement avec PM2 et Nginx sur votre serveur VPS Hostinger.**
