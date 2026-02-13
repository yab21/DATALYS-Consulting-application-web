/**
 * Stockage sécurisé avec chiffrement et fallback rétrocompatible
 * Permet la migration progressive sans casser les sessions existantes
 */
import CryptoJS from 'crypto-js';

// Clé de chiffrement depuis variable d'environnement (NEXT_PUBLIC_STORAGE_KEY dans .env)
const STORAGE_KEY = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_STORAGE_KEY : undefined;

// Dérivation de clé sécurisée avec PBKDF2 (au lieu du MD5 par défaut de CryptoJS)
const PBKDF2_ITERATIONS = 10000;
const deriveKey = (passphrase: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray => {
  return CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });
};

const encryptValue = (value: string, passphrase: string): string => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = deriveKey(passphrase, salt);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(value, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }); // lgtm[js/insufficient-password-hash] - key derived via PBKDF2 with SHA256 (10000 iterations)
  // Stocker salt + iv + ciphertext encodés en base64
  return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
};

const decryptValue = (stored: string, passphrase: string): string | null => {
  try {
    // Nouveau format: salt:iv:ciphertext
    if (stored.includes(':')) {
      const parts = stored.split(':');
      if (parts.length === 3) {
        const salt = CryptoJS.enc.Hex.parse(parts[0]);
        const iv = CryptoJS.enc.Hex.parse(parts[1]);
        const ciphertext = parts[2];
        const key = deriveKey(passphrase, salt);
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (result && result.length > 0) return result;
        return null;
      }
    }
    // Ancien format: fallback vers CryptoJS.AES.decrypt simple pour rétrocompatibilité
    const decrypted = CryptoJS.AES.decrypt(stored, passphrase);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    return (result && result.length > 0) ? result : null;
  } catch {
    return null;
  }
};

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
        // Chiffrer la valeur avec PBKDF2 + AES-CBC
        const encrypted = encryptValue(value, this.encryptionKey);

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

    // Stockage avec encodage base64 (clé de chiffrement non définie ou erreur)
    const encoded = btoa(unescape(encodeURIComponent(value)));
    localStorage.setItem(key, encoded);
    localStorage.setItem(key + '_encoded', 'true');
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
      // Tentative de déchiffrement (supporte ancien et nouveau format)
      const result = decryptValue(value, this.encryptionKey);

      if (result) {
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
    } else {
      // Données encodées en base64 ou ancien format non chiffré - rétrocompatibilité
      const isEncoded = localStorage.getItem(key + '_encoded') === 'true';
      if (isEncoded) {
        try {
          const decoded = decodeURIComponent(escape(atob(value)));
          if (process.env.NODE_ENV === 'development') console.log(`SecureStorage: ${key} lu (décodé)`);
          return decoded;
        } catch {
          // Fallback si le décodage échoue
        }
      }
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
    localStorage.removeItem(key + '_encrypted');
    localStorage.removeItem(key + '_encoded');
    
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
          const result = decryptValue(value, this.encryptionKey);
          if (!result) {
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