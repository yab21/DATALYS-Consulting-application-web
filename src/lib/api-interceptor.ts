"use client";

import { errorHandler } from "./error-handler";
import { SecureStorage } from "./secure-storage";

// Types pour les réponses d'erreur
interface ApiErrorResponse {
  message?: string;
  status?: string;
  code?: number;
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private redirectCallback: (() => void) | null = null;

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
  public setRedirectCallback(callback: () => void) {
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
      "accès non autorisé",
      "please login again",
      "veuillez vous reconnecter"
    ];

    // Vérifier les messages d'erreur
    if (response?.message) {
      const message = response.message.toLowerCase();
      if (tokenExpiredMessages.some((msg) => message.includes(msg))) {
        console.log('🔒 Token expiré détecté via message:', response.message);
        return true;
      }
    }

    // Vérifier le statut avec indicateurs de token
    if (response?.status === "error" && response?.message) {
      const message = response.message.toLowerCase();
      if (message.includes("token") || message.includes("auth") || message.includes("session")) {
        console.log('🔒 Token expiré détecté via statut error:', response.message);
        return true;
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
        const message = response.message.toLowerCase();
        // Si le message parle de token/auth = token expiré
        if (message.includes('token') || message.includes('auth') || message.includes('session')) {
          console.log('🔒 Token expiré détecté via code 403 avec message auth:', response.message);
          return true;
        }
        // Si le message parle de permissions = vraie erreur de permissions
        if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
          console.warn('⚠️ Erreur de permissions détectée (403):', response.message);
          return false;
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
          '/projects/all'
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
  private handleTokenExpiration() {
    console.warn(
      "🔒 Token expiré détecté - Nettoyage et redirection en cours...",
    );

    // Émettre un événement global pour notifier tous les composants
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('token-expired', {
        detail: {
          timestamp: new Date().toISOString(),
          reason: 'Token expiration detected by API interceptor'
        }
      }));
    }

    // Nettoyer toutes les données d'authentification
    SecureStorage.removeItem("authToken");
    SecureStorage.removeItem("refreshToken");
    SecureStorage.removeItem("userInfo");
    SecureStorage.removeItem("userProfile");
    SecureStorage.removeItem("permissions");
    
    // Nettoyer également le localStorage si des données y sont stockées
    if (typeof window !== "undefined") {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Afficher une notification à l'utilisateur
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('global-error-notification', {
        detail: {
          type: 'warning',
          title: 'Session expirée',
          message: 'Votre session a expiré. Vous allez être redirigé vers la page de connexion.',
          persistent: true
        }
      }));
    }

    // Délai court pour permettre à la notification de s'afficher
    setTimeout(() => {
      // Appeler le callback de redirection si défini
      if (this.redirectCallback) {
        this.redirectCallback();
      } else {
        // Redirection par défaut
        if (typeof window !== "undefined") {
          window.location.href = "/connexion";
        }
      }
    }, 1000);
  }

  /**
   * Intercepter les réponses fetch
   */
  public async interceptResponse(response: Response): Promise<Response> {
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
        // Retourner immédiatement pour éviter d'autres traitements
        return response;
      }

      // PRIORITÉ 2: Traitement des autres erreurs seulement si ce n'est pas un token expiré
      if (isJsonError) {
        // Analyser l'erreur avec le système de gestion d'erreurs
        const errorDetails = errorHandler.analyzeError(errorData, {
          url: response.url,
          method: "unknown",
          status: response.status,
        });

        // Gérer l'erreur seulement si ce n'est pas une erreur de navigation normale
        if (response.status !== 404 || !response.url.includes("/api/")) {
          await errorHandler.handleError(errorDetails);
        }
      } else {
        // Analyser l'erreur réseau seulement pour les vraies erreurs API
        if (
          response.url.includes("/api/") ||
          response.url.includes("dashboard")
        ) {
          const errorDetails = errorHandler.analyzeError(errorData, {
            url: response.url,
            status: response.status,
          });
          await errorHandler.handleError(errorDetails);
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

      window.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        try {
          const response = await originalFetch(input, init);
          return await this.interceptResponse(response);
        } catch (error) {
          console.error("Erreur lors de la requête interceptée:", error);

          const url = typeof input === "string" ? input : input.toString();
          const isApiCall = url.includes("/api/") || url.includes("dashboard");

          // Vérifier si l'erreur réseau pourrait indiquer un token expiré
          if (isApiCall && this.isNetworkErrorRelatedToAuth(error)) {
            console.log('🔒 Erreur réseau pouvant indiquer un token expiré');
            this.handleTokenExpiration();
            return Promise.reject(error);
          }

          // Analyser l'erreur réseau avec le gestionnaire d'erreurs
          if (isApiCall) {
            const errorDetails = errorHandler.analyzeError(error, {
              url: url,
              method: init?.method || "GET",
            });
            await errorHandler.handleError(errorDetails);
          }

          throw error;
        }
      };

      // Marquer comme intercepté pour éviter les doubles intercepteurs
      (window.fetch as any).__intercepted = true;
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

      const response = await fetch(url, {
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

export const setRedirectCallback = (callback: () => void) =>
  apiInterceptor.setRedirectCallback(callback);

export const setupGlobalInterceptor = () =>
  apiInterceptor.setupGlobalInterceptor();

export default apiInterceptor;
