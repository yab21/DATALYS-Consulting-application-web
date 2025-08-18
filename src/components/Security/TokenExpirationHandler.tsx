"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { setRedirectCallback, setupGlobalInterceptor } from '@/lib/api-interceptor';

interface TokenExpirationHandlerProps {
  children: ReactNode;
}

/**
 * Composant pour gérer automatiquement l'expiration du token
 * À placer au niveau racine de l'application
 */
export const TokenExpirationHandler: React.FC<TokenExpirationHandlerProps> = ({ children }) => {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Configurer l'intercepteur global
    setupGlobalInterceptor();
    
    // Configurer le callback de redirection pour l'intercepteur API
    const handleTokenExpiration = () => {
      if (isAuthenticated) {
        console.warn('Token expiré, déconnexion automatique');
        logout();
      }
      router.push('/connexion');
    };

    setRedirectCallback(handleTokenExpiration);

    // Cleanup function
    return () => {
      setRedirectCallback(() => {});
    };
  }, [router, logout, isAuthenticated]);

  // Surveiller les erreurs globales liées à l'authentification
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      if (error && error.message && error.message.includes('Token')) {
        console.warn('Erreur de token détectée globalement');
        logout();
        router.push('/connexion');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason && typeof reason === 'object' && reason.message) {
        const message = reason.message.toLowerCase();
        if (message.includes('token') || message.includes('unauthorized')) {
          console.warn('Promesse rejetée liée à l\'authentification');
          logout();
          router.push('/connexion');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [router, logout]);

  return <>{children}</>;
};

export default TokenExpirationHandler;