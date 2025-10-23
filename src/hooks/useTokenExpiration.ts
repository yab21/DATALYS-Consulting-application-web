"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getContextualErrorMessage, ERROR_MESSAGES } from '@/lib/error-messages';

interface TokenExpirationResponse {
  message?: string;
  status?: string;
  code?: number;
  response?: {
    status?: number;
    data?: any;
  };
}

/**
 * Hook pour gérer l'expiration du token et rediriger automatiquement
 */
export const useTokenExpiration = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleExpiredToken = useCallback(() => {
    // Émettre un événement global pour notifier tous les composants
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('token-expired', {
        detail: {
          timestamp: new Date().toISOString(),
          source: 'useTokenExpiration hook'
        }
      }));

      // Notification utilisateur
      window.dispatchEvent(new CustomEvent('global-error-notification', {
        detail: {
          type: 'warning',
          title: 'Session expirée',
          message: ERROR_MESSAGES.AUTH.SESSION_EXPIRED,
          persistent: true
        }
      }));
    }

    // Déconnecter l'utilisateur
    logout();
    
    // Délai court pour permettre à la notification de s'afficher
    setTimeout(() => {
      router.push('/connexion');
    }, 1000);
  }, [logout, router]);

  const checkTokenExpiration = useCallback((response: TokenExpirationResponse) => {
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

    // Vérifier le message d'erreur
    if (response?.message) {
      const message = response.message.toLowerCase();
      if (tokenExpiredMessages.some(msg => message.includes(msg))) {
        console.warn('🔒 Token expiré détecté via message:', response.message);
        handleExpiredToken();
        return true;
      }
    }

    // Vérifier les codes de statut HTTP
    const statusCode = response?.code || response?.response?.status;
    if (statusCode === 401) {
      console.warn('🔒 Token expiré détecté via code 401');
      handleExpiredToken();
      return true;
    }

    if (statusCode === 403) {
      // Pour 403, vérifier si c'est vraiment un token expiré ou un problème de permissions
      if (response?.message) {
        const message = response.message.toLowerCase();
        if (message.includes('token') || message.includes('auth') || message.includes('session')) {
          console.warn('🔒 Token expiré détecté via code 403 avec contexte auth');
          handleExpiredToken();
          return true;
        }
        // Si le message parle de permissions, ce n'est pas un token expiré
        if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
          console.warn('⚠️ Erreur de permissions détectée (403), pas de token expiré');
          return false;
        }
      }
      // Par défaut, traiter 403 comme token expiré si pas de contexte
      console.warn('🔒 Token expiré présumé via code 403');
      handleExpiredToken();
      return true;
    }

    // Vérifier le statut d'erreur avec indicateurs de token
    if (response?.status === "error" && response?.message) {
      const message = response.message.toLowerCase();
      if (message.includes("token") || message.includes("auth") || message.includes("session")) {
        console.warn('🔒 Token expiré détecté via statut error avec contexte auth');
        handleExpiredToken();
        return true;
      }
    }

    return false;
  }, [handleExpiredToken]);

  /**
   * Intercepter les réponses fetch pour détecter les tokens expirés
   */
  const interceptFetchResponse = useCallback(async (response: Response) => {
    if (!response.ok) {
      try {
        const errorData = await response.clone().json();
        checkTokenExpiration(errorData);
      } catch (error) {
        // Si l'erreur n'est pas du JSON, vérifier le statut HTTP
        if (response.status === 401 || response.status === 403) {
          checkTokenExpiration({ message: "Token expiré", status: "error" });
        }
      }
    }
    return response;
  }, [checkTokenExpiration]);

  /**
   * Wrapper pour fetch qui gère automatiquement l'expiration du token
   */
  const securedFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      return await interceptFetchResponse(response);
    } catch (error) {
      console.error('Erreur lors de la requête sécurisée:', error);
      throw error;
    }
  }, [interceptFetchResponse]);

  /**
   * Vérifier manuellement si une réponse indique un token expiré
   */
  const handleApiError = useCallback((error: any) => {
    if (error && typeof error === 'object') {
      checkTokenExpiration(error);
    }
  }, [checkTokenExpiration]);

  return {
    checkTokenExpiration,
    securedFetch,
    handleApiError
  };
};

export default useTokenExpiration;