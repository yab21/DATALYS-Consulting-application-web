/**
 * Stockage sécurisé avec chiffrement et fallback rétrocompatible
 * Permet la migration progressive sans casser les sessions existantes
 */
import CryptoJS from 'crypto-js';

// Clé de chiffrement depuis variable d'environnement (NEXT_PUBLIC_STORAGE_KEY dans .env)
const STORAGE_KEY = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_STORAGE_KEY : undefined;

if (typeof window !== 'undefined' && !STORAGE_KEY) {
  console.warn('⚠️ NEXT_PUBLIC_STORAGE_KEY non définie. Le chiffrement du stockage local est désactivé.');
}

export class SecureStorage {
  private static encryptionKey: string | undefined = STORAGE_KEY || undefined;

  /**
   * Stockage sécurisé avec chiffrement
   */
  static setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    if (this.encryptionKey) {
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

        if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${key} stocké (chiffré)`);
        return;
      } catch (error) {
        console.warn(`SecureStorage: Échec du chiffrement pour ${key}, fallback non chiffré`);
      }
    }

    // Stockage sans chiffrement (clé non définie ou erreur)
    localStorage.setItem(key, value);
    localStorage.removeItem(key + '_encrypted');

    if (key === 'authToken' || key === 'userInfo') {
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { action: 'set', key } }));
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

    if (isEncrypted && this.encryptionKey) {
      try {
        // Tentative de déchiffrement
        const decrypted = CryptoJS.AES.decrypt(value, this.encryptionKey);
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (result && result.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${key} déchiffré`);
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
      if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${key} lu (non chiffré)`);
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
    
    if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${key} supprimé`);
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
      if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: Migration de ${key}`);
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
      if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${migratedCount} clé(s) migrée(s)`);
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

    if (process.env.NODE_ENV === 'development') console.log('SecureStorage: Nettoyage complet');
  }

  /**
   * Nettoyage d'urgence en cas de corruption des données chiffrées
   */
  static emergencyCleanup(): void {
    if (typeof window === 'undefined') return;

    if (process.env.NODE_ENV === 'development') console.log('SecureStorage: Nettoyage d\'urgence');
    
    const keysToCheck = ['authToken', 'userInfo', 'refreshToken'];
    
    keysToCheck.forEach(key => {
      const isEncrypted = localStorage.getItem(key + '_encrypted') === 'true';
      if (isEncrypted && this.encryptionKey) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const decrypted = CryptoJS.AES.decrypt(value, this.encryptionKey);
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            if (!result || result.length === 0) {
              if (process.env.NODE_ENV === 'development') console.log(`Nettoyage: Suppression de ${key}`);
              this.removeItem(key);
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') console.log(`Nettoyage: Suppression de ${key}`);
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
      if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: Test ${success ? 'OK' : 'ÉCHOUÉ'}`);
      
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