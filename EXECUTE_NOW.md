# 🚨 COMMANDES À EXÉCUTER IMMÉDIATEMENT

## 1. SÉCURISATION D'URGENCE (2 minutes)

```bash
# 1.1 Sauvegarder l'environnement actuel
cp .env .env.backup

# 1.2 Générer nouveaux secrets
echo "NEXTAUTH_SECRET=$(openssl rand -hex 64)" > .env.secrets
echo "STORAGE_KEY=$(openssl rand -hex 64)" >> .env.secrets
echo "🔑 Nouveaux secrets générés dans .env.secrets"

# 1.3 Installer jsonwebtoken pour sécuriser JWT
npm install jsonwebtoken @types/jsonwebtoken

# 1.4 Vérifier les dépendances vulnérables
npm audit --audit-level moderate

# 1.5 Corriger automatiquement ce qui peut l'être
npm audit fix
```

## 2. MISE À JOUR ENVIRONNEMENT (5 minutes)

```bash
# 2.1 Éditer .env avec les nouveaux secrets
# Remplacer les valeurs suivantes dans .env:

# AVANT (DANGEREUX):
NEXTAUTH_SECRET="e4989f4db6697fe70a67ea47eeac6679c43705d6e30893a769d35b424db0749b"
NEXT_PUBLIC_STORAGE_KEY="45485d220b30e51ffce0b91c9b140c67a0c135fdf9ae5af8572be4e02909503b"

# APRÈS (SÉCURISÉ):
NEXTAUTH_SECRET="[COPIER_DEPUIS_.env.secrets]"
STORAGE_KEY="[COPIER_DEPUIS_.env.secrets]"  # Enlever NEXT_PUBLIC_ !!!

# 2.2 Supprimer les clés Firebase publiques dangereuses
# Commenter ou supprimer ces lignes dans .env:
# NEXT_PUBLIC_FIREBASE_API_KEY=
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
# etc.

# 2.3 Créer nouvelles clés Firebase privées
echo "🔥 URGENT: Créer nouveau projet Firebase avec nouvelles clés"
echo "🔥 URGENT: Mettre les nouvelles clés dans .env (SANS NEXT_PUBLIC_)"
```

## 3. TESTS DE VALIDATION (3 minutes)

```bash
# 3.1 Tester la build
npm run build

# 3.2 Tester le middleware de sécurité
npm run dev &
sleep 5
curl -X POST http://localhost:3001/tableaudebord -H "User-Agent: <script>alert('xss')</script>"
# Devrait bloquer avec erreur 403

# 3.3 Tester la validation des fichiers
# Aller sur interface d'upload et essayer d'uploader un fichier .exe
# Devrait être bloqué
```

## 4. DÉPLOIEMENT SÉCURISÉ (selon l'hébergement)

### Si vous restez sur Hostinger temporairement:
```bash
# 4.1 Uploader SEULEMENT les nouveaux fichiers sécurisés
# - .env (avec nouveaux secrets)
# - src/middleware.ts
# - src/middleware/security-middleware.ts
# - src/lib/jwt-security.ts
# - src/lib/file-security.ts
# - src/lib/upload-security-immediate.ts
# - package.json (avec jsonwebtoken)

# 4.2 Redémarrer l'application
pm2 restart datalys-app
pm2 logs datalys-app --lines 50
```

### Si vous migrez vers nouveau serveur (RECOMMANDÉ):
```bash
# 4.1 Préparer l'environnement DigitalOcean
# - Créer Droplet Ubuntu 22.04
# - Installer Node.js, PM2, Nginx
# - Configurer certificat SSL avec Let's Encrypt

# 4.2 Déployer version sécurisée
git add .
git commit -m "🛡️ Security hardening: JWT validation, file upload security, middleware protection"
git push origin main

# 4.3 Déployer sur nouveau serveur
# (Instructions détaillées dans MIGRATION_GUIDE.md)
```

## 5. MONITORING IMMÉDIAT

```bash
# 5.1 Surveiller les logs
tail -f /var/log/nginx/error.log
pm2 logs datalys-app --lines 100

# 5.2 Vérifier les tentatives d'attaque
grep "SÉCURITÉ" /var/log/datalys/app.log | tail -20

# 5.3 Dashboard de sécurité
# Aller sur: /admin/security (après implémentation)
```

## ⚠️ ORDRE DE PRIORITÉ

1. **CRITIQUE** (Dans l'heure): Rotations secrets, JWT fixé, uploads sécurisés
2. **URGENT** (Aujourd'hui): Middleware activé, tests validés, app redémarrée
3. **IMPORTANT** (Cette semaine): Migration vers hébergement sécurisé

## 🆘 EN CAS DE PROBLÈME

Si l'application ne démarre plus:
```bash
# Revenir à la version précédente
cp .env.backup .env
git checkout HEAD~1
npm run build
pm2 restart datalys-app
```

Puis contacter support technique avec les logs:
```bash
pm2 logs datalys-app --err --lines 50
```

## 📞 CONTACT D'URGENCE

- **Support technique**: [VOTRE_EMAIL]
- **Logs errors**: `pm2 logs datalys-app --err`
- **Status serveur**: `pm2 status`
- **Monitoring**: `htop` pour voir la charge CPU/mémoire

---
⏰ **Temps total estimé**: 30 minutes pour sécurisation d'urgence
🛡️ **Résultat**: Protection immédiate contre les attaques identifiées