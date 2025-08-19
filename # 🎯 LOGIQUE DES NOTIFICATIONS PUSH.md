# 🎯 LOGIQUE DES NOTIFICATIONS PUSH

## 📤 QUI ENVOIE LES MESSAGES ?

**Les deux !** Admins ET partenaires peuvent envoyer des messages :

- **Partenaires** → Envoient des messages aux admins
- **Admins** → Envoient des messages aux partenaires ET des notifications officielles

## 📱 QUI REÇOIT LES NOTIFICATIONS PUSH ?

**Seulement les ADMINS** reçoivent les notifications push automatiques :

| **Qui envoie** | **Qui reçoit** | **Type de notification** |
|----------------|----------------|-------------------------|
| **Partenaire** | **Tous les admins** | `⚠️ Message HAUTE` / `🚨 Message CRITIQUE` |
| **Partenaire** | **Tous les admins** | `⚠️ Support HAUTE` / `🚨 Support CRITIQUE` |
| **Admin** | **Utilisateur assigné** | Notification officielle |

## 🔔 DÉCLENCHEURS DES NOTIFICATIONS PUSH

Les notifications push sont envoyées **automatiquement** quand :

1. **Un partenaire envoie un message** avec priorité `"haute"` ou `"critique"`
2. **Un partenaire crée une demande de support** avec priorité `"haute"` ou `"critique"`

## 📋 EXEMPLE CONCRET

```json
// Un partenaire envoie ce message :
{
  "title": "🚨 URGENT: Problème serveur",
  "description": "Le serveur principal ne répond plus",
  "priority": "critique",  // ← Déclenche notification push
  "project_id": 1
}
```

**Résultat :**
- ✅ Message sauvegardé en base
- 📱 **Notification push envoyée à TOUS les admins** : `🚨 Message CRITIQUE`

## 🤔 POURQUOI CETTE LOGIQUE ?

1. **Partenaires** → Ont besoin d'alerter rapidement les admins en cas d'urgence
2. **Admins** → Doivent être notifiés immédiatement des problèmes critiques
3. **Système unifié** → Toutes les communications dans une seule table

## 📊 RÉSUMÉ

- ✅ **Partenaires** : Envoient des messages → Notifications push aux admins
- ✅ **Admins** : Reçoivent les notifications push automatiques
- ✅ **Système** : Fonctionne parfaitement pour alerter les admins des urgences

Votre système est conçu pour que les **partenaires puissent alerter rapidement les admins** en cas de problème critique ! 🚨

---

## 🔧 CONFIGURATION TECHNIQUE

### Variables d'Environnement
```bash
# Activation des notifications automatiques
FCM_AUTO_NOTIFY_HIGH_PRIORITY=True
FCM_AUTO_NOTIFY_CRITICAL_PRIORITY=True
```

### Priorités qui déclenchent les notifications
- `"haute"` → Notification `⚠️`
- `"critique"` → Notification `🚨`

### Destinataires des notifications
- **Messages urgents** → Tous les utilisateurs avec `role_id = 1` (admins)
- **Support urgent** → Tous les utilisateurs avec `role_id = 1` (admins)
- **Notifications officielles** → Utilisateur spécifique assigné

---

## 🚀 EXEMPLES D'UTILISATION

### Scénario 1 : Partenaire alerte les admins
```http
POST /messages/send
{
  "title": "Problème de connexion",
  "description": "Impossible d'accéder au système depuis 30 minutes",
  "priority": "critique",
  "project_id": 123
}
```
→ **Résultat** : Notification push `🚨 Message CRITIQUE` envoyée à tous les admins

### Scénario 2 : Demande de support urgente
```http
POST /support/request
{
  "title": "Bug critique",
  "description": "Les utilisateurs ne peuvent plus sauvegarder leurs données",
  "priority": "haute",
  "project_id": 456
}
```
→ **Résultat** : Notification push `⚠️ Support HAUTE` envoyée à tous les admins

---

## 📱 STRUCTURE DES NOTIFICATIONS PUSH

### Format de la notification
```json
{
  "notification": {
    "title": "🚨 Message CRITIQUE",
    "body": "Nouveau message: Problème de connexion"
  },
  "data": {
    "incident_id": "789",
    "type": "message",
    "priority": "critique",
    "action": "open_message"
  }
}
```

### Actions disponibles
- `open_message` → Ouvrir le message dans l'application
- `open_support` → Ouvrir la demande de support
- `open_notification` → Ouvrir la notification officielle
