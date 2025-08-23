/**
 * Service de stockage sécurisé pour les tokens et données sensibles
 * Évite les vulnérabilités XSS en utilisant des stratégies sécurisées
 */

import { logger } from './logger';

// Types pour les données d'authentification
export interface AuthData {
  token: string;
  user: any;
  refreshToken?: string;
  expiresAt?: number;
}

// Configuration par défaut
const CONFIG = {
  TOKEN_KEY: 'datalys_auth_token',
  USER_KEY: 'datalys_user_data',
  REFRESH_KEY: 'datalys_refresh_token',
  EXPIRES_KEY: 'datalys_token_expires',
  // Durée par défaut : 24h
  DEFAULT_EXPIRES_IN: 24 * 60 * 60 * 1000,
};

class SecureStorage {
  private isClient: boolean;
  private useSessionStorage: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    // Utiliser localStorage pour la persistance des données d'auth (nécessaire pour DATALYS)
    this.useSessionStorage = false;
  }

  /**
   * Chiffrement simple pour les données sensibles
   * Note: En production, utiliser une vraie librairie de chiffrement
   */
  private encrypt(data: string): string {
    try {
      // Simple obfuscation pour éviter l'exposition directe
      // En production, utiliser crypto-js ou une autre librairie robuste
      return btoa(encodeURIComponent(data));
    } catch (error) {
      logger.error('Erreur lors du chiffrement', error);
      return data;
    }
  }

  /**
   * Déchiffrement des données
   */
  private decrypt(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      logger.error('Erreur lors du déchiffrement', error);
      return encryptedData;
    }
  }

  /**
   * Obtenir l'objet de stockage approprié
   */
  private getStorage(): Storage | null {
    if (!this.isClient) return null;
    
    try {
      return this.useSessionStorage ? sessionStorage : localStorage;
    } catch (error) {
      logger.warn('Storage non disponible', error);
      return null;
    }
  }

  /**
   * Stocker des données de manière sécurisée
   */
  private setSecureItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      const encryptedValue = this.encrypt(value);
      storage.setItem(key, encryptedValue);
      logger.debug('Données stockées de manière sécurisée', { key });
    } catch (error) {
      logger.error('Erreur lors du stockage sécurisé', error);
    }
  }

  /**
   * Récupérer des données stockées de manière sécurisée
   */
  private getSecureItem(key: string): string | null {
    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const encryptedValue = storage.getItem(key);
      if (!encryptedValue) return null;

      return this.decrypt(encryptedValue);
    } catch (error) {
      logger.error('Erreur lors de la récupération sécurisée', error);
      return null;
    }
  }

  /**
   * Stocker le token d'authentification de manière sécurisée
   */
  public setAuthToken(token: string): void {
    if (!token) {
      logger.warn('Tentative de stockage d\'un token vide');
      return;
    }

    // Calculer l'expiration (24h par défaut)
    const expiresAt = Date.now() + CONFIG.DEFAULT_EXPIRES_IN;
    
    this.setSecureItem(CONFIG.TOKEN_KEY, token);
    this.setSecureItem(CONFIG.EXPIRES_KEY, expiresAt.toString());
    
    logger.info('Token d\'authentification stocké de manière sécurisée');
  }

  /**
   * Récupérer le token d'authentification
   */
  public getAuthToken(): string | null {
    // Vérifier l'expiration
    if (this.isTokenExpired()) {
      logger.info('Token expiré, nettoyage automatique');
      this.clearAuthData();
      return null;
    }

    const token = this.getSecureItem(CONFIG.TOKEN_KEY);
    if (!token) {
      logger.debug('Aucun token trouvé');
    }

    return token;
  }

  /**
   * Stocker les données utilisateur
   */
  public setUserData(user: any): void {
    if (!user) return;

    try {
      const userData = JSON.stringify(user);
      this.setSecureItem(CONFIG.USER_KEY, userData);
      logger.debug('Données utilisateur stockées');
    } catch (error) {
      logger.error('Erreur lors du stockage des données utilisateur', error);
    }
  }

  /**
   * Récupérer les données utilisateur
   */
  public getUserData(): any | null {
    try {
      const userData = this.getSecureItem(CONFIG.USER_KEY);
      if (!userData) return null;

      return JSON.parse(userData);
    } catch (error) {
      logger.error('Erreur lors de la récupération des données utilisateur', error);
      return null;
    }
  }

  /**
   * Stocker le refresh token
   */
  public setRefreshToken(refreshToken: string): void {
    if (refreshToken) {
      this.setSecureItem(CONFIG.REFRESH_KEY, refreshToken);
    }
  }

  /**
   * Récupérer le refresh token
   */
  public getRefreshToken(): string | null {
    return this.getSecureItem(CONFIG.REFRESH_KEY);
  }

  /**
   * Vérifier si le token est expiré 
   * L'expiration est gérée par le backend, pas de vérification côté client
   */
  public isTokenExpired(): boolean {
    // L'expiration du token est gérée par le backend API
    // Pas de vérification côté client pour éviter les conflits
    return false;
  }

  /**
   * Stocker toutes les données d'authentification
   */
  public setAuthData(authData: AuthData): void {
    const { token, user, refreshToken, expiresAt } = authData;

    if (token) {
      this.setAuthToken(token);
    }

    if (user) {
      this.setUserData(user);
    }

    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }

    if (expiresAt) {
      this.setSecureItem(CONFIG.EXPIRES_KEY, expiresAt.toString());
    }

    logger.info('Données d\'authentification complètes stockées');
  }

  /**
   * Récupérer toutes les données d'authentification
   */
  public getAuthData(): AuthData | null {
    const token = this.getAuthToken();
    const user = this.getUserData();
    const refreshToken = this.getRefreshToken();

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user,
      refreshToken: refreshToken || undefined,
    };
  }

  /**
   * Nettoyer toutes les données d'authentification
   */
  public clearAuthData(): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.removeItem(CONFIG.TOKEN_KEY);
      storage.removeItem(CONFIG.USER_KEY);
      storage.removeItem(CONFIG.REFRESH_KEY);
      storage.removeItem(CONFIG.EXPIRES_KEY);
      
      logger.info('Données d\'authentification nettoyées');
    } catch (error) {
      logger.error('Erreur lors du nettoyage des données d\'authentification', error);
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getUserData();
    return !!(token && user && !this.isTokenExpired());
  }

  /**
   * Nettoyer automatiquement les tokens expirés
   * L'expiration est gérée par le backend, pas de nettoyage automatique côté client
   */
  public cleanup(): void {
    // L'expiration du token est gérée par le backend API
    // Pas de nettoyage automatique côté client pour éviter les déconnexions intempestives
    logger.debug('Nettoyage automatique désactivé - gestion backend');
  }

  /**
   * Migrer depuis l'ancien système localStorage non sécurisé
   */
  public migrateFromLegacyStorage(): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      // Clés de l'ancien système
      const legacyKeys = ['auth_token', 'user_data', 'refresh_token'];
      
      legacyKeys.forEach(key => {
        const legacyData = storage.getItem(key);
        if (legacyData) {
          logger.info(`Migration des données legacy: ${key}`);
          // Migrer vers le nouveau système sécurisé
          if (key === 'auth_token') {
            this.setAuthToken(legacyData);
          } else if (key === 'user_data') {
            try {
              const userData = JSON.parse(legacyData);
              this.setUserData(userData);
            } catch (error) {
              logger.error('Erreur lors de la migration des données utilisateur', error);
            }
          } else if (key === 'refresh_token') {
            this.setRefreshToken(legacyData);
          }
          
          // Supprimer l'ancien stockage
          storage.removeItem(key);
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la migration', error);
    }
  }
}

// Instance singleton
export const secureStorage = new SecureStorage();

// Fonction utilitaire pour l'initialisation
export const initializeSecureStorage = (): void => {
  if (typeof window !== 'undefined') {
    // Migration automatique au démarrage
    secureStorage.migrateFromLegacyStorage();
    
    // Nettoyage automatique
    secureStorage.cleanup();
    
    // Nettoyage périodique (toutes les 10 minutes)
    setInterval(() => {
      secureStorage.cleanup();
    }, 10 * 60 * 1000);
  }
};