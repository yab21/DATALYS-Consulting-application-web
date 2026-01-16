# Guide de Déploiement Hostinger - Pages d'Erreur Personnalisées

## Configuration des Pages d'Erreur sur Hostinger

### 1. Upload des Fichiers d'Erreur

Uploadez le fichier `public/502.html` vers votre serveur Hostinger :
```bash
# Via FTP/cPanel File Manager
/public_html/502.html
```

### 2. Configuration Nginx (si vous avez accès)

Si vous avez accès à la configuration Nginx sur Hostinger :

```nginx
# Dans votre fichier de configuration Nginx
error_page 502 503 504 /502.html;

location = /502.html {
    root /home/USERNAME/public_html;
    internal;
}
```

### 3. Alternative : Fichier .htaccess (Apache)

Si Hostinger utilise Apache au lieu de Nginx, créez un `.htaccess` :

```apache
# .htaccess dans public_html
ErrorDocument 502 /502.html
ErrorDocument 503 /502.html
ErrorDocument 504 /502.html
```

### 4. Via cPanel (Méthode Hostinger Standard)

1. **Connectez-vous à cPanel**
2. **Allez dans "Error Pages"**
3. **Sélectionnez "502 Bad Gateway"**
4. **Uploadez le contenu de `502.html`**
5. **Répétez pour 503 et 504**

### 5. Test de la Configuration

Pour tester les pages d'erreur :

```bash
# Arrêter temporairement votre application
pm2 stop your-app-name

# Visiter votre site - devrait montrer la page 502 personnalisée
# Redémarrer l'application
pm2 start your-app-name
```

### 6. Monitoring et Alertes

Configurez des alertes pour être notifié des erreurs 502 :

```javascript
// Dans votre application Node.js
process.on('uncaughtException', (error) => {
  console.error('Erreur critique:', error);
  // Envoyer notification
});
```

## Bonnes Pratiques Hostinger

1. **Utilisez PM2** pour la gestion des processus
2. **Configurez les logs** appropriés
3. **Mettez en place un monitoring** (UptimeRobot, etc.)
4. **Sauvegardez régulièrement** votre configuration

## Contact Support

Si vous ne pouvez pas configurer les pages d'erreur personnalisées :
- Contactez le support Hostinger
- Demandez l'activation des "Custom Error Pages"
- Fournissez les fichiers HTML préparés