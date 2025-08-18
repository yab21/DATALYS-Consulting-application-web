# 🎯 APIs Prêtes pour l'Intégration Frontend

## 📋 Guide d'Intégration - Datalys Consulting

---

## **🔐 1. AUTHENTIFICATION (Priorité 1)**

### **APIs Disponibles :**
```http
✅ POST /auth/login
✅ POST /auth/logout  
✅ POST /auth/reset-password-request
```

**Usage :** Login/logout, gestion des sessions

### **Exemple de requête Login :**
```javascript
POST /auth/login
Content-Type: application/json

{
    "email": "admin@datalysconsulting.com",
    "password": "password123"
}

Response:
{
    "status": "success",
    "message": "Connexion réussie",
    "data": {
        "id": 1,
        "name": "Admin",
        "email": "admin@datalysconsulting.com",
        "role_id": 1,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

---

## **👑 2. APIs ADMIN (Interface d'administration)**

### **👥 Gestion Utilisateurs :**
```http
✅ POST /users/getByCriteria    # Lister/rechercher utilisateurs
✅ POST /users/create           # Créer nouveaux admins/partenaires  
✅ POST /users/update           # Modifier profils utilisateurs
✅ POST /users/delete           # Supprimer/désactiver utilisateurs
```

### **🤝 Gestion Partenaires :**
```http
✅ POST /partners/getByCriteria # Lister/rechercher partenaires
✅ POST /partners/create        # Créer nouveaux partenaires + logo
✅ POST /partners/update        # Modifier informations partenaires
✅ POST /partners/delete        # Supprimer partenaires
```

### **📋 Gestion Projets :**
```http
✅ POST /projects/getByCriteria # Lister/rechercher projets
✅ POST /projects/create        # Créer projets pour partenaires
✅ POST /projects/update        # Modifier projets  
✅ POST /projects/delete        # Supprimer projets
```

### **📁 Gestion Dossiers :**
```http
✅ POST /folders/getByCriteria  # Lister/rechercher dossiers
✅ POST /folders/create         # Créer structure dossiers
✅ POST /folders/update         # Modifier dossiers
✅ POST /folders/delete         # Supprimer dossiers
✅ POST /folders/upload         # Upload avec création dossier
```

### **📄 Gestion Fichiers :**
```http
✅ POST /files/getByCriteria    # Lister/rechercher fichiers
✅ POST /files/update           # Modifier métadonnées fichiers
✅ POST /files/delete           # Supprimer fichiers
✅ POST /files/upload           # Upload fichiers
✅ POST /files/upload/logo      # Upload logos partenaires
✅ GET  /files/serve/<filename> # Servir fichiers
✅ GET  /files/download/<id>    # Télécharger fichiers
```

### **🚨 Gestion Incidents :**
```http
✅ POST /incidents/getByCriteria # Lister/rechercher incidents
✅ POST /incidents/create        # Créer rapports incident
✅ POST /incidents/update        # Traiter incidents
✅ POST /incidents/delete        # Supprimer incidents
```

### **🎭 Gestion Rôles :**
```http
✅ POST /roles/getByCriteria    # Lister rôles
✅ POST /roles/create           # Créer nouveaux rôles
✅ POST /roles/update           # Modifier rôles
✅ POST /roles/delete           # Supprimer rôles
```

### **🎯 Gestion Permissions :**
```http
✅ POST /user_project_permissions/getByCriteria # Lister permissions
✅ POST /user_project_permissions/create        # Assigner utilisateurs
✅ POST /user_project_permissions/update        # Modifier permissions
✅ POST /user_project_permissions/delete        # Retirer permissions
```

---

## **🤝 3. APIs PARTENAIRE (Interface partenaire - avec filtrage)**

### **📊 Consultation Données :**
```http
✅ POST /projects/getByCriteria    # MES projets uniquement
✅ POST /folders/getByCriteria     # MES dossiers uniquement  
✅ POST /files/getByCriteria       # MES fichiers uniquement
✅ POST /incidents/getByCriteria   # MES incidents uniquement
✅ GET  /files/serve/<filename>    # MES fichiers autorisés
✅ GET  /files/download/<id>       # MES fichiers autorisés
```

### **💬 Communication :**
```http
✅ POST /incidents/create          # Signaler incidents sur MES projets
```

---

## **📊 4. APIs MONITORING (Status système)**
```http
✅ GET /health                     # Santé application
✅ GET /api/sessions/health        # Santé Redis
✅ GET /api/sessions/stats         # Stats sessions
```

---

## **📈 5. APIs HISTORIQUE**
```http
✅ POST /action_history/getByCriteria # Historique actions
✅ POST /action_history/log           # Enregistrer actions
```

---

# 🎯 RECOMMANDATIONS FRONTEND PAR INTERFACE

## **🖥️ Interface ADMIN - Pages à créer :**

### **🔐 Authentification :**
- **Page Login** (`POST /auth/login`)
- **Gestion mot de passe** (`POST /auth/reset-password-request`)

### **📊 Dashboard Admin :**
- **Vue d'ensemble** avec métriques
- **Utiliser** `POST /*/getByCriteria` pour les stats

### **👥 Gestion Utilisateurs :**
- **Liste utilisateurs** (`POST /users/getByCriteria`)
- **Création/édition** (`POST /users/create|update`)
- **Suppression** (`POST /users/delete`)

### **🤝 Gestion Partenaires :**
- **Liste partenaires** (`POST /partners/getByCriteria`)
- **Création avec logo** (`POST /partners/create`)
- **Édition** (`POST /partners/update`)

### **📋 Gestion Projets :**
- **Liste projets** (`POST /projects/getByCriteria`)
- **Création/édition** (`POST /projects/create|update`)
- **Association partenaires**

### **📁 Gestion Documents :**
- **Arborescence dossiers** (`POST /folders/getByCriteria`)
- **Upload fichiers** (`POST /files/upload`)
- **Gestion métadonnées** (`POST /files/update`)

---

## **👤 Interface PARTENAIRE - Pages à créer :**

### **🔐 Authentification :**
- **Page Login** (même API que admin)

### **📊 Mon Dashboard :**
- **MES projets** (`POST /projects/getByCriteria` avec filtrage)
- **MES statistiques**

### **📋 Mes Projets :**
- **Liste MES projets** (filtrés automatiquement)
- **Détails projets** (lecture seule)

### **📁 Mes Documents :**
- **MES dossiers** (`POST /folders/getByCriteria` filtré)
- **MES fichiers** (`POST /files/getByCriteria` filtré)
- **Téléchargement** (`GET /files/download/<id>`)

### **🚨 Support :**
- **Signaler incidents** (`POST /incidents/create`)
- **Voir MES incidents** (`POST /incidents/getByCriteria` filtré)

---

# 🚨 IMPORTANT : Sécurité côté Frontend

## **🔒 Gestion des Rôles :**

```javascript
// Exemple de logique frontend
if (user.role === 'admin') {
    // Afficher toutes les APIs admin
    showAdminInterface();
} else if (user.role === 'partenaire') {
    // Afficher seulement APIs lecture partenaire
    showPartnerInterface();
}
```

## **🎯 Filtrage Automatique :**

Les APIs existantes doivent être **modifiées côté backend** pour filtrer automatiquement selon le rôle :

```javascript
// Les partenaires ne verront que LEURS données
// Le filtrage se fait automatiquement côté API
POST /projects/getByCriteria 
// → Admin : tous les projets
// → Partenaire : seulement ses projets
```

---

# 📝 EXEMPLES DE REQUÊTES

## **Exemple : Lister les projets**

### **Pour Admin :**
```javascript
POST /projects/getByCriteria
Headers: {
    "Authorization": "Bearer <admin_token>",
    "Content-Type": "application/json"
}
Body: {
    "index": 0,
    "size": 10,
    "data": {
        "is_active": true
    }
}

Response: {
    "items": [...], // TOUS les projets
    "count": 50,
    "message": {...}
}
```

### **Pour Partenaire :**
```javascript
POST /projects/getByCriteria
Headers: {
    "Authorization": "Bearer <partner_token>",
    "Content-Type": "application/json"
}
Body: {
    "index": 0,
    "size": 10,
    "data": {
        "is_active": true
    }
}

Response: {
    "items": [...], // SEULEMENT ses projets
    "count": 3,
    "message": {...}
}
```

## **Exemple : Upload de fichier**

```javascript
POST /files/upload
Headers: {
    "Authorization": "Bearer <admin_token>"
}
Body: FormData {
    "file": <fichier>,
    "project_id": "1",
    "folder_id": "2",
    "description": "Document important"
}

Response: {
    "status": "success",
    "message": "Fichier uploadé avec succès",
    "data": {
        "file_path": "/files/serve/documents/filename.pdf",
        "file_url": "http://82.112.253.137:8082/files/serve/documents/filename.pdf"
    }
}
```

---

# ✅ CONCLUSION

## **🎉 Vous avez 95% des APIs nécessaires !**

### **Prêt pour intégration immédiate :**
- **Interface Admin complète** ✅
- **Interface Partenaire** (avec quelques adaptations) ✅
- **Authentification et sécurité** ✅

### **Seules modifications nécessaires :**
1. **Ajouter filtrage par rôle** dans les APIs existantes
2. **Créer `POST /files/create`** (optionnel)

### **APIs prêtes à utiliser MAINTENANT :**
- ✅ Authentification complète
- ✅ CRUD complet pour toutes les entités
- ✅ Upload/download de fichiers
- ✅ Monitoring et santé système

---

# 🚀 ÉTAPES SUIVANTES

1. **Commencer l'intégration** avec les APIs existantes
2. **Implémenter la sécurité** côté frontend (rôles)
3. **Tester les workflows** Admin et Partenaire
4. **Ajouter le filtrage** côté backend si nécessaire

---

*Document généré pour l'équipe Frontend*  
*Version : 1.0*  
*Date : $(date)*