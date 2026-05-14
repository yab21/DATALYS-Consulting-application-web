"use client";

import { errorHandler } from "./error-handler";
import { SecureStorage } from "./secure-storage";
import { API_CONFIG } from "./api-config";

// Types pour les réponses d'erreur
interface ApiErrorResponse {
  message?: string | { code: number; message: string };
  status?: string;
  code?: number;
}

// Erreur spécifique pour l'expiration de token
export class TokenExpiredError extends Error {
  constructor(message: string = 'Session expirée') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private redirectCallback: (() => void) | null = null;
  private tokenExpirationHandled: boolean = false;
  private lastTokenExpirationTime: number = 0;
  private redirectInProgress: boolean = false;

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  /**
   * Définir le callback de redirection
   */
  public setRedirectCallback(callback: (() => void) | null) {
    this.redirectCallback = callback;
  }

  /**
   * Vérifier si une réponse indique un token expiré
   */
  private isTokenExpired(
    response: ApiErrorResponse,
    statusCode?: number,
    url?: string,
  ): boolean {
    // Exclure les endpoints d'authentification : un 401 ou message d'erreur sur ces endpoints
    // signifie "code/identifiants incorrects", pas "session expirée"
    if (url) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes('/auth/verify-mfa') || urlLower.includes('/auth/login')) {
        return false;
      }
    }

    // Messages explicites d'expiration de token
    const tokenExpiredMessages = [
      "token expiré",
      "token expired",
      "token has expired",
      "jwt expired",
      "session expired",
      "session expirée",
      "authentification requise",
      "authentication required",
      "invalid token",
      "token invalide",
      "unauthorized access",
      // "accès non autorisé", // Retiré car peut être une vraie erreur de permissions pour les partenaires
      "please login again",
      "veuillez vous reconnecter"
    ];

    // Vérifier les messages d'erreur
    if (response?.message) {
      // Gérer le cas où message est un objet ou une string
      const messageText = typeof response.message === 'string' 
        ? response.message 
        : typeof response.message === 'object' && response.message.message 
          ? response.message.message 
          : '';
      
      if (messageText && typeof messageText === 'string') {
        const message = messageText.toLowerCase();
        if (tokenExpiredMessages.some((msg) => message.includes(msg))) {
          console.log('🔒 Token expiré détecté via message:', messageText);
          return true;
        }
      }
    }

    // Vérifier le statut avec indicateurs de token
    if (response?.status === "error" && response?.message) {
      // Gérer le cas où message est un objet ou une string
      const messageText = typeof response.message === 'string' 
        ? response.message 
        : typeof response.message === 'object' && response.message.message 
          ? response.message.message 
          : '';
      
      if (messageText && typeof messageText === 'string') {
        const message = messageText.toLowerCase();
        if (message.includes("token") || message.includes("auth") || message.includes("session")) {
          console.log('🔒 Token expiré détecté via statut error:', messageText);
          return true;
        }
      }
    }

    // Analyse des codes HTTP avec contexte
    if (statusCode === 401) {
      // 401 = Unauthorized - généralement un token expiré
      console.log('🔒 Token expiré détecté via code 401 sur:', url);
      return true;
    }

    if (statusCode === 403) {
      // 403 peut être token expiré ou permissions insuffisantes
      // Vérifier le contexte pour distinguer
      if (response?.message) {
        // Gérer le cas où message est un objet ou une string
        const messageText = typeof response.message === 'string' 
          ? response.message 
          : typeof response.message === 'object' && response.message.message 
            ? response.message.message 
            : '';
        
        if (messageText && typeof messageText === 'string') {
          const message = messageText.toLowerCase();
          // Si le message parle de token/auth = token expiré
          if (message.includes('token') || message.includes('authentification') || message.includes('session')) {
            console.log('🔒 Token expiré détecté via code 403 avec message auth:', messageText);
            return true;
          }
          // Si le message parle de permissions ou d'accès partenaire = vraie erreur de permissions
          if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied') || message.includes('accès non autorisé')) {
            console.warn('⚠️ Erreur de permissions détectée (403):', messageText);
            return false;
          }
        }
      }
      
      // Vérifier l'URL pour des endpoints spécifiques qui peuvent légitimement retourner 403
      if (url) {
        const urlLower = url.toLowerCase();
        // Endpoints qui peuvent légitimement retourner 403 pour des raisons de permissions
        const permissionEndpoints = [
          '/users/getbycriteria',
          '/users/list',
          '/roles/',
          '/permissions/',
          '/admin/',
          '/partners/all',
          '/projects/all',
          '/dashboard/partner/' // Ajout pour éviter de traiter les erreurs 403 des partenaires comme des expirations
        ];
        
        // Si l'URL contient un de ces endpoints, c'est probablement une vraie erreur de permissions
        if (permissionEndpoints.some(endpoint => urlLower.includes(endpoint))) {
          console.warn('⚠️ Erreur 403 sur un endpoint protégé, permissions insuffisantes:', url);
          return false;
        }
        
        // Si l'URL contient des mots-clés d'authentification, c'est probablement un token expiré
        if (urlLower.includes('/auth/') || urlLower.includes('/login') || urlLower.includes('/token')) {
          console.log('🔒 Token expiré détecté via code 403 sur endpoint auth:', url);
          return true;
        }
      }
      
      // Par défaut, ne pas traiter 403 comme token expiré sans contexte clair
      console.warn('⚠️ Erreur 403 détectée, mais pas considérée comme token expiré:', url);
      return false;
    }

    return false;
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpiration(): void {
    const now = Date.now();

    // Protection contre les multiples appels simultanés (fenêtre de 3 secondes)
    if (this.redirectInProgress || (now - this.lastTokenExpirationTime) < 3000) {
      console.warn("🔒 Expiration token déjà en cours de traitement, ignorée");
      return;
    }

    this.redirectInProgress = true;
    this.tokenExpirationHandled = true;
    this.lastTokenExpirationTime = now;

    console.warn(
      "🔒 Token expiré détecté - Nettoyage et redirection IMMÉDIATE...",
    );

    // Nettoyer toutes les données d'authentification IMMÉDIATEMENT
    this.cleanupAuthData();

    // Émettre un événement global pour notifier tous les composants
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('token-expired', {
        detail: {
          timestamp: new Date().toISOString(),
          reason: 'Token expiration detected by API interceptor'
        }
      }));
    }

    // Redirection IMMÉDIATE (pas de délai)
    if (typeof window !== "undefined") {
      // Appeler le callback de redirection si défini
      if (this.redirectCallback) {
        this.redirectCallback();
      } else {
        // Redirection par défaut immédiate
        window.location.href = "/connexion?expired=true";
      }
    }
  }

  /**
   * Nettoyer toutes les données d'authentification
   */
  private cleanupAuthData(): void {
    // Nettoyer via SecureStorage
    SecureStorage.removeItem("authToken");
    SecureStorage.removeItem("refreshToken");
    SecureStorage.removeItem("userInfo");
    SecureStorage.removeItem("userProfile");
    SecureStorage.removeItem("permissions");

    // Nettoyer également le localStorage si des données y sont stockées
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Nettoyer sessionStorage aussi
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user') || key.includes('session'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  }

  /**
   * Vérifier si une redirection pour expiration est en cours
   */
  public isRedirectInProgress(): boolean {
    return this.redirectInProgress;
  }

  /**
   * Réinitialiser l'état de l'intercepteur (utile après une nouvelle connexion)
   */
  public resetState(): void {
    this.tokenExpirationHandled = false;
    this.redirectInProgress = false;
    this.lastTokenExpirationTime = 0;
  }

  /**
   * Intercepter les réponses fetch
   */
  public async interceptResponse(response: Response): Promise<Response> {
    // Si une redirection est déjà en cours, ne pas traiter la réponse
    // SAUF pour les endpoints d'authentification
    const isAuthEndpoint = response.url.toLowerCase().includes('/auth/');
    if (this.redirectInProgress && !isAuthEndpoint) {
      throw new TokenExpiredError('Redirection en cours suite à expiration de session');
    }

    // Réinitialiser l'état si un endpoint auth réussit (nouvelle connexion)
    if (response.ok && isAuthEndpoint) {
      this.resetState();
    }

    if (!response.ok) {
      let errorData: any = {};
      let isJsonError = false;

      try {
        errorData = await response.clone().json();
        isJsonError = true;
      } catch (error) {
        // Pas de JSON valide, utiliser les infos de base
        errorData = {
          message: response.statusText || `HTTP ${response.status}`,
          status: response.status
        };
      }

      // PRIORITÉ 1: Vérifier l'expiration de token AVANT tout
      if (this.isTokenExpired(errorData, response.status, response.url)) {
        this.handleTokenExpiration();
        // Lancer une erreur spécifique pour empêcher le composant d'afficher son propre message
        throw new TokenExpiredError('Votre session a expiré. Redirection vers la page de connexion...');
      }

      // PRIORITÉ 2: Traitement des autres erreurs seulement si ce n'est pas un token expiré
      // NE PAS déclencher de notifications automatiques pour éviter les doublons
      // Les composants gèrent leurs propres notifications d'erreur
      if (isJsonError) {
        // Analyser l'erreur avec le système de gestion d'erreurs SANS notification automatique
        const errorDetails = errorHandler.analyzeError(errorData, {
          url: response.url,
          method: "unknown",
          status: response.status,
        });

        // Log l'erreur mais ne pas déclencher de notification automatique
        console.warn("Erreur API interceptée:", errorDetails);
      } else {
        // Log les erreurs réseau mais ne pas déclencher de notifications automatiques
        if (
          response.url.includes("/api/") ||
          response.url.includes("dashboard")
        ) {
          console.warn("Erreur réseau interceptée:", {
            url: response.url,
            status: response.status,
            statusText: response.statusText
          });
        }
      }
    }
    return response;
  }

  /**
   * Intercepter toutes les requêtes fetch globalement
   */
  public setupGlobalInterceptor() {
    if (typeof window !== "undefined" && !(window.fetch as any).__intercepted) {
      const originalFetch = window.fetch;
      const self = this;

      window.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        // Si une redirection est déjà en cours, rejeter immédiatement
        // SAUF pour les endpoints d'authentification qui doivent toujours passer
        const requestUrl = typeof input === "string" ? input : input.toString();
        const isAuthEndpoint = requestUrl.toLowerCase().includes('/auth/');
        if (self.redirectInProgress && !isAuthEndpoint) {
          throw new TokenExpiredError('Session expirée - redirection en cours');
        }

        try {
          const response = await originalFetch(input, init);
          return await self.interceptResponse(response);
        } catch (error) {
          // Si c'est déjà une TokenExpiredError, la propager
          if (error instanceof TokenExpiredError) {
            throw error;
          }

          const url = typeof input === "string" ? input : input.toString();
          const isApiCall = url.includes("/api/") || url.includes("dashboard") || url.includes(API_CONFIG?.BASE_URL || '');

          // Vérifier si l'erreur réseau pourrait indiquer un token expiré
          if (isApiCall && self.isNetworkErrorRelatedToAuth(error)) {
            console.log('🔒 Erreur réseau pouvant indiquer un token expiré');
            self.handleTokenExpiration();
            throw new TokenExpiredError('Session expirée suite à erreur réseau');
          }

          // Log l'erreur réseau mais ne pas déclencher de notification automatique
          if (isApiCall) {
            console.warn("Erreur réseau lors de la requête:", {
              url: url,
              method: init?.method || "GET",
              error: error instanceof Error ? error.message : String(error)
            });
          }

          throw error;
        }
      };

      // Marquer comme intercepté pour éviter les doubles intercepteurs
      (window.fetch as any).__intercepted = true;
      console.log('✅ Intercepteur global fetch configuré');
    }
  }

  /**
   * Wrapper pour fetch avec interception automatique
   */
  public async securedFetch(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    try {
      // Construire l'URL complète si c'est un chemin relatif
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

      // Ajouter les headers d'authentification par défaut
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options?.headers as Record<string, string>) || {}),
      };

      // Ajouter le token s'il existe
      if (typeof window !== "undefined") {
        const token = SecureStorage.getItem("authToken");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      return await this.interceptResponse(response);
    } catch (error) {
      console.error("Erreur lors de la requête sécurisée:", error);
      throw error;
    }
  }

  /**
   * Vérifier si une erreur réseau pourrait être liée à l'authentification
   */
  private isNetworkErrorRelatedToAuth(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    
    // Erreurs réseau qui peuvent cacher un token expiré
    return (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('authentication') ||
      message.includes('token') ||
      message.includes('session') ||
      (error?.status === 401) ||
      (error?.status === 403)
    );
  }

  /**
   * Gérer les erreurs d'API manuellement
   */
  public handleApiError(error: any): void {
    if (error && typeof error === "object") {
      // Extraire le statut depuis différentes structures possibles
      const status = error?.status || error?.response?.status || error?.statusCode;
      const url = error?.config?.url || error?.url || 'unknown';
      
      if (this.isTokenExpired(error, status, url)) {
        this.handleTokenExpiration();
      }
    }
  }

  /**
   * Configurer un gestionnaire global d'erreurs
   */
  private setupGlobalErrorHandler() {
    // Intercepter les erreurs non gérées
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        const error = event.reason;
        if (
          error &&
          error.name === "TypeError" &&
          error.message.includes("fetch")
        ) {
          // Pourrait être une erreur de réseau liée à l'authentification
          console.warn(
            "Erreur de réseau détectée, vérification de l'authentification",
          );
        }
      });
    }
  }
}

// Instance singleton
export const apiInterceptor = ApiInterceptor.getInstance();

// Export des fonctions utilitaires
export const securedFetch = (url: string, options?: RequestInit) =>
  apiInterceptor.securedFetch(url, options);

export const handleApiError = (error: any) =>
  apiInterceptor.handleApiError(error);

export const setRedirectCallback = (callback: (() => void) | null) =>
  apiInterceptor.setRedirectCallback(callback);

export const setupGlobalInterceptor = () =>
  apiInterceptor.setupGlobalInterceptor();

export const resetInterceptorState = () =>
  apiInterceptor.resetState();

export const isRedirectInProgress = () =>
  apiInterceptor.isRedirectInProgress();

// Fonction utilitaire pour vérifier si une erreur est une TokenExpiredError
export const isTokenExpiredError = (error: any): boolean => {
  return error instanceof TokenExpiredError || error?.name === 'TokenExpiredError';
};

export default apiInterceptor;
