/**
 * Stockage sécurisé avec chiffrement et fallback rétrocompatible
 * Permet la migration progressive sans casser les sessions existantes
 */
import CryptoJS from 'crypto-js';

// Clé de chiffrement par défaut (à remplacer par variable d'environnement)
const DEFAULT_ENCRYPTION_KEY = 'DATALYS_SECURE_2024_DEFAULT_KEY';

export class SecureStorage {
  private static encryptionKey: string = 
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STORAGE_KEY) || 
    DEFAULT_ENCRYPTION_KEY;

  /**
   * Stockage sécurisé avec chiffrement
   */
  static setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    try {
      // Chiffrer la valeur
      const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
      
      // Stocker avec flag de chiffrement
      localStorage.setItem(key, encrypted);
      localStorage.setItem(key + '_encrypted', 'true');
      
      // Émettre un événement custom pour les changements d'authentification
      if (key === 'authToken' || key === 'userInfo') {
        window.dispatchEvent(new CustomEvent('auth-change', { detail: { action: 'set', key } }));
      }
      
      console.log(`✅ SecureStorage: ${key} stocké avec chiffrement`);
    } catch (error) {
      console.warn(`⚠️ SecureStorage: Échec du chiffrement pour ${key}, fallback vers stockage normal:`, error);
      
      // Fallback vers stockage normal si erreur
      localStorage.setItem(key, value);
      localStorage.removeItem(key + '_encrypted'); // Pas de flag si pas chiffré
    }
  }

  /**
   * Récupération avec déchiffrement automatique et fallback rétrocompatible
   */
  static getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    const value = localStorage.getItem(key);
    if (!value) return null;

    const isEncrypted = localStorage.getItem(key + '_encrypted') === 'true';

    if (isEncrypted) {
      try {
        // Tentative de déchiffrement
        const decrypted = CryptoJS.AES.decrypt(value, this.encryptionKey);
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (result && result.length > 0) {
          console.log(`🔓 SecureStorage: ${key} déchiffré avec succès`);
          return result;
        } else {
          console.warn(`⚠️ SecureStorage: Échec du déchiffrement pour ${key}, nettoyage et fallback`);
          // Nettoyer les données corrompues
          localStorage.removeItem(key + '_encrypted');
          // Si les données semblent être du JSON non chiffré, les retourner
          try {
            JSON.parse(value);
            return value;
          } catch {
            // Sinon, forcer la déconnexion
            this.removeItem(key);
            return null;
          }
        }
      } catch (error) {
        console.warn(`⚠️ SecureStorage: Erreur de déchiffrement pour ${key}:`, error);
        // Nettoyer les données corrompues et forcer nouveau login
        localStorage.removeItem(key + '_encrypted');
        this.removeItem(key);
        return null;
      }
    } else {
      // Données non chiffrées (ancien format) - rétrocompatibilité
      console.log(`📖 SecureStorage: ${key} lu en mode rétrocompatible (non chiffré)`);
      return value;
    }
  }

  /**
   * Suppression sécurisée
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(key);
    localStorage.removeItem(key + '_encrypted'); // Nettoyer aussi le flag
    
    // Émettre un événement custom pour les changements d'authentification
    if (key === 'authToken' || key === 'userInfo') {
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { action: 'remove', key } }));
    }
    
    console.log(`🗑️ SecureStorage: ${key} supprimé`);
  }

  /**
   * Migration d'une clé vers le stockage chiffré
   */
  static migrateToEncrypted(key: string): boolean {
    if (typeof window === 'undefined') return false;

    const value = this.getItem(key);
    if (!value) return false;

    const isEncrypted = localStorage.getItem(key + '_encrypted') === 'true';
    
    if (!isEncrypted) {
      console.log(`🔄 SecureStorage: Migration de ${key} vers stockage chiffré`);
      this.setItem(key, value); // Re-stockage avec chiffrement
      return true;
    }

    return false; // Déjà chiffré
  }

  /**
   * Vérification de l'état de chiffrement d'une clé
   */
  static isEncrypted(key: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(key + '_encrypted') === 'true';
  }

  /**
   * Migration automatique de toutes les clés sensibles
   */
  static migrateAllSensitiveKeys(): void {
    if (typeof window === 'undefined') return;

    const sensitiveKeys = ['authToken', 'userInfo', 'refreshToken'];
    let migratedCount = 0;

    sensitiveKeys.forEach(key => {
      if (this.migrateToEncrypted(key)) {
        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      console.log(`🔒 SecureStorage: ${migratedCount} clé(s) migrée(s) vers stockage chiffré`);
    }
  }

  /**
   * Nettoyage complet (utile pour déconnexion)
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = ['authToken', 'userInfo', 'refreshToken', 'rememberMe'];
    
    keysToRemove.forEach(key => {
      this.removeItem(key);
    });

    console.log('🧹 SecureStorage: Nettoyage complet effectué');
  }

  /**
   * Nettoyage d'urgence en cas de corruption des données chiffrées
   */
  static emergencyCleanup(): void {
    if (typeof window === 'undefined') return;

    console.log('🚨 SecureStorage: Nettoyage d\'urgence des données corrompues');
    
    const keysToCheck = ['authToken', 'userInfo', 'refreshToken'];
    
    keysToCheck.forEach(key => {
      const isEncrypted = localStorage.getItem(key + '_encrypted') === 'true';
      if (isEncrypted) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const decrypted = CryptoJS.AES.decrypt(value, this.encryptionKey);
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            if (!result || result.length === 0) {
              console.log(`🧹 Nettoyage: Suppression de ${key} (déchiffrement échoué)`);
              this.removeItem(key);
            }
          } catch (error) {
            console.log(`🧹 Nettoyage: Suppression de ${key} (erreur déchiffrement)`);
            this.removeItem(key);
          }
        }
      }
    });
  }

  /**
   * Test de fonctionnement du chiffrement
   */
  static testEncryption(): boolean {
    try {
      const testKey = 'test_encryption';
      const testValue = 'test_value_123';
      
      this.setItem(testKey, testValue);
      const retrieved = this.getItem(testKey);
      this.removeItem(testKey);
      
      const success = retrieved === testValue;
      console.log(`🧪 SecureStorage: Test de chiffrement ${success ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
      
      return success;
    } catch (error) {
      console.error('🚨 SecureStorage: Erreur lors du test de chiffrement:', error);
      return false;
    }
  }
}

// Export des fonctions pour compatibilité avec l'API localStorage standard
export const secureLocalStorage = {
  setItem: SecureStorage.setItem.bind(SecureStorage),
  getItem: SecureStorage.getItem.bind(SecureStorage),
  removeItem: SecureStorage.removeItem.bind(SecureStorage),
  clear: SecureStorage.clearAll.bind(SecureStorage),
};

// Initialisation automatique et test au premier import
if (typeof window !== 'undefined') {
  // Nettoyage d'urgence en cas de données corrompues
  SecureStorage.emergencyCleanup();
  
  // Test rapide du chiffrement
  SecureStorage.testEncryption();
  
  // Migration automatique des données existantes
  setTimeout(() => {
    SecureStorage.migrateAllSensitiveKeys();
  }, 1000);

  // Utilitaire global pour le débogage (développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    (window as any).debugSecureStorage = {
      cleanup: () => SecureStorage.emergencyCleanup(),
      clearAll: () => SecureStorage.clearAll(),
      test: () => SecureStorage.testEncryption(),
      migrate: () => SecureStorage.migrateAllSensitiveKeys()
    };
    console.log('🔧 Debug: window.debugSecureStorage disponible pour le débogage');
  }
}