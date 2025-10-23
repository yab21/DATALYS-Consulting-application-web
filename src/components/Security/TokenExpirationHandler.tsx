"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { setRedirectCallback, setupGlobalInterceptor } from '@/lib/api-interceptor';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import { ERROR_MESSAGES } from '@/lib/error-messages';

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
  const { showNotification } = useSimpleNotifications();

  useEffect(() => {
    // Configurer l'intercepteur global
    setupGlobalInterceptor();
    
    // Configurer le callback de redirection pour l'intercepteur API
    const handleTokenExpiration = () => {
      console.warn('🔒 Token expiré détecté - Configuration de la redirection');
      
      if (isAuthenticated) {
        console.warn('Token expiré, déconnexion automatique');
        logout();
      }
      
      // Notification à l'utilisateur
      showNotification({
        type: "warning",
        title: "Session expirée",
        message: ERROR_MESSAGES.AUTH.SESSION_EXPIRED,
        duration: 5000,
      });
      
      // Délai pour permettre à la notification de s'afficher
      setTimeout(() => {
        router.push('/connexion');
      }, 1000);
    };

    setRedirectCallback(handleTokenExpiration);

    // Écouter l'événement global de token expiré
    const handleTokenExpiredEvent = (event: CustomEvent) => {
      console.log('🔒 Événement token-expired reçu:', event.detail);
      handleTokenExpiration();
    };

    // Écouter les notifications d'erreur globales
    const handleGlobalErrorNotification = (event: CustomEvent) => {
      const { type, title, message, persistent } = event.detail;
      showNotification({
        type,
        title,
        message,
        duration: persistent ? 10000 : 5000,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('token-expired', handleTokenExpiredEvent as EventListener);
      window.addEventListener('global-error-notification', handleGlobalErrorNotification as EventListener);
    }

    // Cleanup function
    return () => {
      setRedirectCallback(() => {});
      if (typeof window !== 'undefined') {
        window.removeEventListener('token-expired', handleTokenExpiredEvent as EventListener);
        window.removeEventListener('global-error-notification', handleGlobalErrorNotification as EventListener);
      }
    };
  }, [router, logout, isAuthenticated, showNotification]);

  // Surveiller les erreurs globales liées à l'authentification (niveau de sécurité supplémentaire)
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      if (error && error.message && error.message.toLowerCase().includes('token')) {
        console.warn('🔒 Erreur de token détectée globalement via window.error');
        // Laisser l'intercepteur API principal gérer la redirection
        window.dispatchEvent(new CustomEvent('token-expired', {
          detail: {
            timestamp: new Date().toISOString(),
            source: 'global error handler',
            error: error.message
          }
        }));
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason && typeof reason === 'object' && reason.message) {
        const message = reason.message.toLowerCase();
        if (message.includes('token') || message.includes('unauthorized') || message.includes('session')) {
          console.warn('🔒 Promesse rejetée liée à l\'authentification via unhandledrejection');
          // Laisser l'intercepteur API principal gérer la redirection
          window.dispatchEvent(new CustomEvent('token-expired', {
            detail: {
              timestamp: new Date().toISOString(),
              source: 'unhandled promise rejection',
              error: message
            }
          }));
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
  }, []);

  return <>{children}</>;
};

export default TokenExpirationHandler;