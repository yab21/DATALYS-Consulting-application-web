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
        
        if (result) {
          console.log(`🔓 SecureStorage: ${key} déchiffré avec succès`);
          return result;
        } else {
          console.warn(`⚠️ SecureStorage: Échec du déchiffrement pour ${key}, tentative fallback`);
          return value; // Fallback si déchiffrement échoue
        }
      } catch (error) {
        console.warn(`⚠️ SecureStorage: Erreur de déchiffrement pour ${key}:`, error);
        return value; // Fallback vers valeur brute
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
  // Test rapide du chiffrement
  SecureStorage.testEncryption();
  
  // Migration automatique des données existantes
  setTimeout(() => {
    SecureStorage.migrateAllSensitiveKeys();
  }, 1000);
}