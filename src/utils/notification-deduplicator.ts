/**
 * Système de déduplication des notifications pour éviter les doublons
 */

interface NotificationEntry {
  id: string;
  message: string;
  type: string;
  timestamp: number;
  expires: number;
}

class NotificationDeduplicator {
  private static instance: NotificationDeduplicator;
  private notifications: Map<string, NotificationEntry> = new Map();
  private readonly DEDUP_WINDOW_MS = 3000; // 3 secondes de fenêtre de déduplication pour éviter les doublons
  private readonly CLEANUP_INTERVAL_MS = 5000; // Nettoyage toutes les 5 secondes

  private constructor() {
    // Nettoyer les notifications expirées périodiquement
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  public static getInstance(): NotificationDeduplicator {
    if (!NotificationDeduplicator.instance) {
      NotificationDeduplicator.instance = new NotificationDeduplicator();
    }
    return NotificationDeduplicator.instance;
  }

  /**
   * Vérifie si une notification doit être affichée ou si c'est un doublon
   */
  public shouldShowNotification(message: string, type: string): boolean {
    const now = Date.now();
    const key = this.generateKey(message, type);
    
    // Nettoyer d'abord les notifications expirées
    this.cleanup();
    
    // Vérifier si cette notification existe déjà
    const existing = this.notifications.get(key);
    if (existing && now < existing.expires) {
      console.log(`🚫 Notification dupliquée ignorée: ${message.substring(0, 50)}...`);
      return false; // Doublon détecté
    }
    
    // Enregistrer cette nouvelle notification
    this.notifications.set(key, {
      id: key,
      message,
      type,
      timestamp: now,
      expires: now + this.DEDUP_WINDOW_MS
    });
    
    console.log(`✅ Notification autorisée: ${message.substring(0, 50)}...`);
    return true; // Notification autorisée
  }

  /**
   * Génère une clé unique pour une notification
   */
  private generateKey(message: string, type: string): string {
    // Normaliser le message pour capturer les variations mineures et les messages similaires
    const normalizedMessage = message
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .trim();
    
    // Pour tous les messages d'erreur génériques, utiliser une clé commune
    if (type === 'error' || normalizedMessage.includes('erreur') || normalizedMessage.includes('error')) {
      // Messages d'erreur serveur communs
      if (normalizedMessage.includes('serveur') || 
          normalizedMessage.includes('server') ||
          normalizedMessage.includes('veuillez ressayer') ||
          normalizedMessage.includes('quelques instants')) {
        return `${type}:server_error_generic`;
      }
      
      // Messages d'erreur de chargement communs
      if (normalizedMessage.includes('impossible') || 
          normalizedMessage.includes('charger') ||
          normalizedMessage.includes('load') ||
          normalizedMessage.includes('projets')) {
        return `${type}:loading_error_generic`;
      }
    }
    
    // Pour les messages de connexion, créer des clés génériques
    if (normalizedMessage.includes('mode hors ligne') || 
        normalizedMessage.includes('connexion perdue') ||
        normalizedMessage.includes('offline')) {
      return `${type}:offline_notification`;
    }
    
    if (normalizedMessage.includes('delai') || 
        normalizedMessage.includes('timeout') ||
        normalizedMessage.includes('lent')) {
      return `${type}:timeout_notification`;
    }
    
    if (normalizedMessage.includes('connexion') || 
        normalizedMessage.includes('reseau') ||
        normalizedMessage.includes('network')) {
      return `${type}:network_notification`;
    }
    
    return `${type}:${this.hash(normalizedMessage)}`;
  }

  /**
   * Fonction de hachage simple pour créer des IDs courts
   */
  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit entier
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Nettoie les notifications expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, notification] of this.notifications.entries()) {
      if (now >= notification.expires) {
        this.notifications.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Nettoyage des notifications: ${cleaned} supprimées, ${this.notifications.size} restantes`);
    }
  }

  /**
   * Réinitialise complètement le cache (utile pour les tests ou debug)
   */
  public reset(): void {
    console.log(`🔄 Réinitialisation du cache notifications (${this.notifications.size} supprimées)`);
    this.notifications.clear();
  }

  /**
   * Statistiques du cache pour debug
   */
  public getStats(): { total: number; active: number; expired: number } {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    
    for (const notification of this.notifications.values()) {
      if (now < notification.expires) {
        active++;
      } else {
        expired++;
      }
    }
    
    return { total: this.notifications.size, active, expired };
  }
}

// Instance singleton
export const notificationDeduplicator = NotificationDeduplicator.getInstance();

// Types pour l'export
export type { NotificationEntry };
export { NotificationDeduplicator };