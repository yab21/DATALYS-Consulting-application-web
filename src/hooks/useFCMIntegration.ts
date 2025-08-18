'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdvancedNotifications } from '@/components/UI/Notifications/AdvancedNotificationProvider';
import { fcmService, initializeFCMForUser, cleanupFCM } from '@/services/fcm';

interface FCMStatus {
  isSupported: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  token: string | null;
  error: string | null;
  isLoading: boolean;
}

export function useFCMIntegration() {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useAdvancedNotifications();
  
  const [fcmStatus, setFCMStatus] = useState<FCMStatus>({
    isSupported: false,
    isInitialized: false,
    hasPermission: false,
    token: null,
    error: null,
    isLoading: true
  });

  // Initialiser FCM quand l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFCMStatus(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        token: null
      }));
      return;
    }

    const initializeFCM = async () => {
      try {
        setFCMStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // Vérifier le support
        const isSupported = fcmService.isSupported();
        if (!isSupported) {
          setFCMStatus(prev => ({
            ...prev,
            isSupported: false,
            isLoading: false,
            error: 'FCM non supporté sur ce navigateur'
          }));
          return;
        }

        // Initialiser FCM
        const success = await initializeFCMForUser(user.id, addNotification);
        
        if (success) {
          const token = fcmService.getCurrentToken();
          const permission = fcmService.getPermissionStatus();
          
          setFCMStatus({
            isSupported: true,
            isInitialized: true,
            hasPermission: permission === 'granted',
            token,
            error: null,
            isLoading: false
          });

          console.log('FCM initialisé avec succès');
        } else {
          setFCMStatus(prev => ({
            ...prev,
            isSupported: true,
            isInitialized: false,
            error: 'Échec de l\'initialisation FCM',
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation FCM:', error);
        setFCMStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          isLoading: false
        }));
      }
    };

    initializeFCM();
  }, [isAuthenticated, user, addNotification]);

  // Nettoyer FCM lors de la déconnexion
  useEffect(() => {
    if (!isAuthenticated) {
      cleanupFCM();
    }
  }, [isAuthenticated]);

  // Gérer les événements de notification
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Notification FCM cliquée:', customEvent.detail);
      
      // Ajouter une notification locale pour indiquer l'action
      addNotification({
        type: 'info',
        title: 'Navigation',
        message: 'Redirection vers la section demandée...',
        category: 'general',
        priority: 'low'
      });
    };

    const handleNotificationClose = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Notification FCM fermée:', customEvent.detail);
    };

    window.addEventListener('fcm-notification-clicked', handleNotificationClick);
    window.addEventListener('fcm-notification-closed', handleNotificationClose);

    return () => {
      window.removeEventListener('fcm-notification-clicked', handleNotificationClick);
      window.removeEventListener('fcm-notification-closed', handleNotificationClose);
    };
  }, [addNotification]);

  // Fonction pour demander les permissions manuellement
  const requestPermission = useCallback(async () => {
    try {
      setFCMStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const permission = await fcmService.requestPermission();
      
      setFCMStatus(prev => ({
        ...prev,
        hasPermission: permission === 'granted',
        isLoading: false,
        error: permission === 'denied' ? 'Permission refusée par l\'utilisateur' : null
      }));

      if (permission === 'granted' && user) {
        // Réinitialiser FCM avec les nouvelles permissions
        const success = await initializeFCMForUser(user.id, addNotification);
        
        if (success) {
          const token = fcmService.getCurrentToken();
          setFCMStatus(prev => ({
            ...prev,
            isInitialized: true,
            token
          }));
        }
      }

      return permission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      setFCMStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        isLoading: false
      }));
      return 'denied';
    }
  }, [user, addNotification]);

  // Fonction pour tester les notifications
  const testNotification = useCallback(() => {
    if (!fcmStatus.hasPermission) {
      addNotification({
        type: 'warning',
        title: 'Permission requise',
        message: 'Les permissions de notification ne sont pas accordées',
        category: 'system',
        priority: 'medium'
      });
      return;
    }

    // Tester une notification locale
    addNotification({
      type: 'info',
      title: 'Test de notification',
      message: 'Ceci est un test du système de notifications FCM',
      category: 'system',
      priority: 'medium',
      persistent: false
    });

    // Tester une notification système si possible
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test DATALYS', {
        body: 'Notification de test du système FCM',
        icon: '/favicon.ico',
        tag: 'fcm-test'
      });
    }
  }, [fcmStatus.hasPermission, addNotification]);

  return {
    fcmStatus,
    requestPermission,
    testNotification,
    isReady: fcmStatus.isInitialized && fcmStatus.hasPermission,
    canRequestPermission: fcmStatus.isSupported && !fcmStatus.hasPermission,
    needsPermission: fcmStatus.isSupported && !fcmStatus.hasPermission
  };
}

// Hook simple pour vérifier le statut FCM
export function useFCMStatus() {
  const [status, setStatus] = useState({
    isSupported: false,
    hasPermission: false,
    token: null as string | null
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSupported = fcmService.isSupported();
      const hasPermission = fcmService.getPermissionStatus() === 'granted';
      const token = fcmService.getCurrentToken();

      setStatus({
        isSupported,
        hasPermission,
        token
      });
    }
  }, []);

  return status;
}

// Hook pour écouter les mises à jour de token FCM
export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Charger le token initial
    const currentToken = fcmService.getCurrentToken();
    setToken(currentToken);

    // Écouter les changements de token (si nécessaire dans le futur)
    const handleTokenChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setToken(customEvent.detail.token);
    };

    window.addEventListener('fcm-token-changed', handleTokenChange);

    return () => {
      window.removeEventListener('fcm-token-changed', handleTokenChange);
    };
  }, []);

  return token;
}