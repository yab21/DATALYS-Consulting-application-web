# 🚀 Déploiement Manuel DATALYS Consulting App

## 📋 **Vue d'ensemble**

Ce projet utilise maintenant un **déploiement manuel** au lieu du déploiement automatique. Vous avez le contrôle total sur le processus de déploiement.

---

## 🛠️ **Fichiers de Déploiement**

### **Scripts principaux :**

- `scripts/deploy-manual.sh` - Script de déploiement manuel
- `scripts/setup-server-manual.sh` - Configuration initiale du serveur
- `ecosystem.config.js` - Configuration PM2 pour la production

### **Documentation :**

- `GUIDE_DEPLOIEMENT_MANUEL.md` - Guide complet de déploiement
- `README_DEPLOIEMENT.md` - Ce fichier (guide rapide)

---

## 🚀 **Déploiement Rapide**

### **1. Configuration initiale du serveur (une seule fois)**

```bash
# Se connecter au serveur
ssh root@82.112.253.137

# Exécuter le script de configuration
chmod +x setup-server-manual.sh
./setup-server-manual.sh
```

### **2. Déploiement depuis votre machine locale**

```bash
# Rendre le script exécutable
chmod +x scripts/deploy-manual.sh

# Déploiement complet
./scripts/deploy-manual.sh deploy

# Ou options disponibles :
./scripts/deploy-manual.sh sync      # Synchronisation uniquement
./scripts/deploy-manual.sh status    # Vérifier le statut
./scripts/deploy-manual.sh logs      # Voir les logs
./scripts/deploy-manual.sh rollback  # Rollback si problème
```

---

## 📊 **Commandes Utiles**

### **Vérification du statut :**

```bash
./scripts/deploy-manual.sh status
```

### **Voir les logs :**

```bash
./scripts/deploy-manual.sh logs
```

### **Rollback rapide :**

```bash
./scripts/deploy-manual.sh rollback
```

### **Vérification manuelle sur le serveur :**

```bash
ssh root@82.112.253.137 "pm2 list && curl -I http://localhost:3000"
```

---

## 🔧 **Structure du Serveur**

```
/var/www/datalys-app/
├── releases/
│   ├── 20241201_143022/  # Version actuelle
│   └── 20241201_142000/  # Version précédente
├── shared/
│   ├── logs/
│   ├── env/
│   │   └── .env.production
│   └── uploads/
└── current -> releases/20241201_143022/  # Lien symbolique
```

---

## ⚠️ **Points Importants**

1. **Variables d'environnement** : Configurez `/var/www/datalys-app/shared/env/.env.production` sur le serveur
2. **Clé SSH** : Assurez-vous que votre clé SSH est configurée pour accéder au serveur
3. **Permissions** : Le script gère automatiquement les permissions et liens symboliques
4. **Rollback** : Garde automatiquement les 5 dernières versions pour rollback

---

## 🆘 **En cas de problème**

### **Application ne démarre pas :**

```bash
ssh root@82.112.253.137 "pm2 logs datalys-app"
```

### **Nginx ne fonctionne pas :**

```bash
ssh root@82.112.253.137 "nginx -t && systemctl status nginx"
```

### **Rollback d'urgence :**

```bash
./scripts/deploy-manual.sh rollback
```

---

## 📞 **Support**

- **Logs PM2** : `pm2 logs datalys-app`
- **Logs Nginx** : `tail -f /var/log/nginx/datalys-app.error.log`
- **Monitoring** : `pm2 monit`
- **Statut système** : `htop`, `df -h`, `free -h`

---

**🎯 Vous avez maintenant le contrôle total sur votre déploiement !**
