"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface TokenExpirationResponse {
  message?: string;
  status?: string;
}

/**
 * Hook pour gérer l'expiration du token et rediriger automatiquement
 */
export const useTokenExpiration = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const checkTokenExpiration = useCallback((response: TokenExpirationResponse) => {
    if (
      response?.message === "Token expiré" || 
      response?.status === "error" ||
      response?.message?.toLowerCase().includes("token") ||
      response?.message?.toLowerCase().includes("unauthorized") ||
      response?.message?.toLowerCase().includes("forbidden")
    ) {
      console.warn('Token expiré détecté, redirection vers la page de connexion');
      
      // Déconnecter l'utilisateur
      logout();
      
      // Rediriger vers la page de connexion
      router.push('/connexion');
      
      return true;
    }
    return false;
  }, [logout, router]);

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