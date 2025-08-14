#!/bin/bash

# 🛠️ Script d'installation serveur pour DATALYS Consulting App
# À exécuter sur le serveur VPS Hostinger (82.112.253.137)

set -e

# Variables
DOMAIN="applicationweb.datalysconsulting.com"
APP_PATH="/var/www/datalys-app"
APP_NAME="datalys-app"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Mise à jour du système
update_system() {
    log_info "🔄 Mise à jour du système..."
    apt update && apt upgrade -y
    log_success "✅ Système mis à jour"
}

# Installation de Node.js
install_nodejs() {
    log_info "📦 Installation de Node.js..."
    
    # Installation via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Vérification
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log_success "✅ Node.js $node_version installé"
    log_success "✅ npm $npm_version installé"
}

# Installation de PM2
install_pm2() {
    log_info "⚡ Installation de PM2..."
    
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    
    log_success "✅ PM2 installé et configuré"
}

# Installation de Nginx
install_nginx() {
    log_info "🌐 Installation de Nginx..."
    
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_success "✅ Nginx installé et démarré"
}

# Installation de Certbot pour SSL
install_certbot() {
    log_info "🔒 Installation de Certbot pour SSL..."
    
    apt install -y certbot python3-certbot-nginx
    
    log_success "✅ Certbot installé"
}

# Configuration des répertoires
setup_directories() {
    log_info "📁 Configuration des répertoires..."
    
    mkdir -p $APP_PATH/{releases,shared/{logs,uploads}}
    mkdir -p /var/log/nginx
    
    # Permissions
    chown -R www-data:www-data $APP_PATH
    chmod -R 755 $APP_PATH
    
    log_success "✅ Répertoires configurés"
}

# Configuration Nginx
setup_nginx() {
    log_info "🌐 Configuration de Nginx..."
    
    # Backup de la configuration par défaut
    mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || true
    
    # Configuration du site
    cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
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
EOF

    # Activer le site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test de la configuration
    nginx -t
    systemctl reload nginx
    
    log_success "✅ Nginx configuré"
}

# Configuration SSL avec Certbot
setup_ssl() {
    log_info "🔒 Configuration SSL avec Let's Encrypt..."
    
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@datalysconsulting.com
    
    # Renouvellement automatique
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    log_success "✅ SSL configuré pour $DOMAIN"
}

# Configuration du firewall
setup_firewall() {
    log_info "🛡️ Configuration du firewall..."
    
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw status
    
    log_success "✅ Firewall configuré"
}

# Installation des outils de monitoring
install_monitoring() {
    log_info "📊 Installation des outils de monitoring..."
    
    apt install -y htop iotop nethogs
    
    # Configuration PM2 monitoring
    pm2 install pm2-logrotate
    
    log_success "✅ Outils de monitoring installés"
}

# Configuration des variables d'environnement
setup_env() {
    log_info "🔧 Configuration des variables d'environnement..."
    
    cat > $APP_PATH/shared/.env << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
# Ajoutez vos autres variables d'environnement ici
EOF

    chmod 600 $APP_PATH/shared/.env
    chown www-data:www-data $APP_PATH/shared/.env
    
    log_success "✅ Variables d'environnement configurées"
}

# Menu principal
main() {
    echo "🛠️  Configuration serveur DATALYS Consulting App"
    echo "================================================="
    echo "Serveur: $(hostname -I | awk '{print $1}')"
    echo "Domaine: $DOMAIN"
    echo ""
    
    read -p "Continuer l'installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    update_system
    install_nodejs
    install_pm2
    install_nginx
    install_certbot
    setup_directories
    setup_nginx
    setup_ssl
    setup_firewall
    install_monitoring
    setup_env
    
    echo ""
    log_success "🎉 Installation terminée!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Configurez vos secrets GitHub (SSH_PRIVATE_KEY)"
    echo "2. Poussez votre code sur la branche 'develop'"
    echo "3. L'application sera automatiquement déployée!"
    echo ""
    echo "🔗 URL: https://$DOMAIN"
    echo "📊 Monitoring PM2: pm2 list"
    echo "📝 Logs: pm2 logs $APP_NAME"
}

# Vérification des privilèges root
if [[ $EUID -ne 0 ]]; then
   log_error "Ce script doit être exécuté en tant que root (sudo)"
   exit 1
fi

# Exécution
main "$@"