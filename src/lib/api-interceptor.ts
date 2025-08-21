"use client";

import { errorHandler } from "./error-handler";

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
    const expiredMessages = [
      "token expiré",
      "token expired",
    ];

    // Messages spécifiques qui indiquent un vrai token expiré
    const tokenExpiredMessages = [
      "token has expired",
      "jwt expired",
      "session expired",
    ];

    // Vérifier d'abord les messages explicites de token expiré
    if (response?.message) {
      const message = response.message.toLowerCase();
      if (tokenExpiredMessages.some((msg) => message.includes(msg))) {
        return true;
      }
      if (expiredMessages.some((msg) => message.includes(msg))) {
        return true;
      }
    }

    // Vérifier le statut avec message de token
    if (response?.status === "error" && response?.message?.includes("Token")) {
      return true;
    }

    // Pour les erreurs 401/403, être plus sélectif
    if (statusCode === 401 || statusCode === 403) {
      // Si l'URL contient "projects" et qu'il n'y a pas de message explicite de token expiré,
      // cela pourrait être un problème de permissions plutôt qu'un token expiré
      if (url && url.includes('/projects/') && !response?.message?.toLowerCase().includes('token')) {
        console.warn('Erreur 401/403 sur l\'API projects - possibleité de problème de permissions plutôt que token expiré');
        return false;
      }
      
      // Pour les autres endpoints, considérer comme token expiré
      return true;
    }

    return false;
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpiration() {
    console.warn(
      "Token expiré détecté, nettoyage des données d'authentification",
    );

    // Nettoyer le localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");

    // Appeler le callback de redirection si défini
    if (this.redirectCallback) {
      this.redirectCallback();
    } else {
      // Redirection par défaut
      if (typeof window !== "undefined") {
        window.location.href = "/connexion";
      }
    }
  }

  /**
   * Intercepter les réponses fetch
   */
  public async interceptResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      try {
        const errorData = await response.clone().json();

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

        if (this.isTokenExpired(errorData, response.status, response.url)) {
          this.handleTokenExpiration();
        }
      } catch (error) {
        // Si ce n'est pas du JSON valide, vérifier le statut HTTP
        if (this.isTokenExpired({}, response.status, response.url)) {
          this.handleTokenExpiration();
        }

        // Analyser l'erreur réseau seulement pour les vraies erreurs API
        if (
          response.url.includes("/api/") ||
          response.url.includes("dashboard")
        ) {
          const errorDetails = errorHandler.analyzeError(error, {
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

          // Analyser l'erreur réseau avec le gestionnaire d'erreurs
          // Éviter les alertes pour les erreurs de navigation normale
          const url = typeof input === "string" ? input : input.toString();
          const isApiCall = url.includes("/api/") || url.includes("dashboard");

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
        const token = localStorage.getItem("authToken");
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
   * Gérer les erreurs d'API manuellement
   */
  public handleApiError(error: any): void {
    if (error && typeof error === "object") {
      if (this.isTokenExpired(error)) {
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
