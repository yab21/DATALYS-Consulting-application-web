'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { useRequestQueue } from '@/lib/request-queue';
import { errorHandler } from '@/lib/error-handler';
import { notificationDeduplicator } from '@/utils/notification-deduplicator';
import NetworkStatusIndicator from './NetworkStatusIndicator';
// Remplacement temporaire de Sonner par le système de notification existant
// Toast simple qui ne déclenche pas d'événements pour éviter les boucles infinies
const toast = {
  error: (title: string, options?: { description?: string; duration?: number; action?: { label: string; onClick: () => void } }) => {
    console.error(`❌ ${title}`, options?.description);
  },
  success: (title: string, options?: { description?: string; duration?: number }) => {
    console.log(`✅ ${title}`, options?.description);
  },
  warning: (title: string, options?: { description?: string; duration?: number }) => {
    console.warn(`⚠️ ${title}`, options?.description);
  },
  info: (title: string, options?: { description?: string; duration?: number }) => {
    console.info(`ℹ️ ${title}`, options?.description);
  }
};

// API publique pour déclencher des notifications depuis l'extérieur avec déduplication
export const networkNotifications = {
  error: (title: string, options?: { description?: string; duration?: number }) => {
    const message = options?.description || '';
    const notificationKey = `${title}: ${message}`;
    
    if (!notificationDeduplicator.shouldShowNotification(notificationKey, 'error')) {
      return; // Notification dupliquée, ignorer
    }
    
    console.error(`❌ ${title}`, message);
    window.dispatchEvent(new CustomEvent('global-error-notification', {
      detail: { type: 'error', title, message, persistent: false }
    }));
  },
  success: (title: string, options?: { description?: string; duration?: number }) => {
    const message = options?.description || '';
    const notificationKey = `${title}: ${message}`;
    
    if (!notificationDeduplicator.shouldShowNotification(notificationKey, 'success')) {
      return; // Notification dupliquée, ignorer
    }
    
    console.log(`✅ ${title}`, message);
    window.dispatchEvent(new CustomEvent('global-error-notification', {
      detail: { type: 'info', title, message, persistent: false }
    }));
  },
  warning: (title: string, options?: { description?: string; duration?: number }) => {
    const message = options?.description || '';
    const notificationKey = `${title}: ${message}`;
    
    if (!notificationDeduplicator.shouldShowNotification(notificationKey, 'warning')) {
      return; // Notification dupliquée, ignorer
    }
    
    console.warn(`⚠️ ${title}`, message);
    window.dispatchEvent(new CustomEvent('global-error-notification', {
      detail: { type: 'warning', title, message, persistent: false }
    }));
  },
  info: (title: string, options?: { description?: string; duration?: number }) => {
    const message = options?.description || '';
    const notificationKey = `${title}: ${message}`;
    
    if (!notificationDeduplicator.shouldShowNotification(notificationKey, 'info')) {
      return; // Notification dupliquée, ignorer
    }
    
    console.info(`ℹ️ ${title}`, message);
    window.dispatchEvent(new CustomEvent('global-error-notification', {
      detail: { type: 'info', title, message, persistent: false }
    }));
  }
};

interface NetworkContextType {
  networkStatus: ReturnType<typeof useNetworkStatus>;
  networkSync: ReturnType<typeof useNetworkSync>;
  requestQueue: ReturnType<typeof useRequestQueue>;
  showNetworkIndicator: boolean;
  setShowNetworkIndicator: (show: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function useNetworkContext() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
}

interface NetworkProviderProps {
  children: React.ReactNode;
  showIndicator?: boolean;
  indicatorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableAutoSync?: boolean;
  enableToasts?: boolean;
}

export function NetworkProvider({ 
  children, 
  showIndicator = true,
  indicatorPosition = 'top-right',
  enableAutoSync = true,
  enableToasts = true
}: NetworkProviderProps) {
  const networkStatus = useNetworkStatus();
  const networkSync = useNetworkSync({ 
    enableAutoSync,
    syncOnReconnect: true,
    syncOnVisibilityChange: true
  });
  const requestQueue = useRequestQueue();
  const [showNetworkIndicator, setShowNetworkIndicator] = useState(showIndicator);
  const [lastOnlineState, setLastOnlineState] = useState(networkStatus.isOnline);

  // Gérer les notifications de changement d'état réseau
  useEffect(() => {
    if (!enableToasts) return;

    const { isOnline } = networkStatus;
    
    if (lastOnlineState !== isOnline) {
      if (!isOnline) {
        // Connexion perdue
        toast.error('Connexion Internet perdue', {
          description: 'L\'application fonctionne en mode hors ligne',
          duration: 5000,
          action: {
            label: 'Réessayer',
            onClick: networkStatus.retry
          }
        });
      } else if (!lastOnlineState && isOnline) {
        // Connexion rétablie
        toast.success('Connexion Internet rétablie', {
          description: 'Synchronisation en cours...',
          duration: 3000
        });
        
        // Forcer la synchronisation après un délai
        setTimeout(() => {
          networkSync.forcSync();
          requestQueue.processQueue();
        }, 1000);
      }
      
      setLastOnlineState(isOnline);
    }
  }, [networkStatus.isOnline, lastOnlineState, enableToasts, networkStatus.retry, networkSync, requestQueue]);

  // Gérer les erreurs de qualité de connexion
  useEffect(() => {
    if (networkStatus.connectionType === 'slow' && enableToasts) {
      toast.warning('Connexion lente détectée', {
        description: 'Certaines fonctionnalités peuvent être ralenties',
        duration: 4000
      });
    }
  }, [networkStatus.connectionType, enableToasts]);

  // Écouter les événements d'erreur globaux
  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      if (!enableToasts) return;
      
      const { type, title, message, persistent } = event.detail;
      
      switch (type) {
        case 'error':
          toast.error(title, {
            description: message,
            duration: persistent ? Infinity : 5000
          });
          break;
        case 'warning':
          toast.warning(title, {
            description: message,
            duration: 4000
          });
          break;
        case 'info':
          toast.info(title, {
            description: message,
            duration: 3000
          });
          break;
      }
    };

    window.addEventListener('global-error-notification', handleGlobalError as EventListener);
    return () => window.removeEventListener('global-error-notification', handleGlobalError as EventListener);
  }, [enableToasts]);

  // Nettoyage périodique
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      errorHandler.cleanup();
    }, 60 * 60 * 1000); // Toutes les heures

    return () => clearInterval(cleanupInterval);
  }, []);

  const contextValue: NetworkContextType = {
    networkStatus,
    networkSync,
    requestQueue,
    showNetworkIndicator,
    setShowNetworkIndicator
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
      
      {showNetworkIndicator && (
        <NetworkStatusIndicator
          position={indicatorPosition}
          detailed={false}
          showQueue={true}
        />
      )}
    </NetworkContext.Provider>
  );
}

// Hook pour utiliser les fonctionnalités réseau de manière simplifiée
export function useNetwork() {
  const {
    networkStatus: { isOnline, connectionType, checkConnection, retry },
    networkSync: { addToSync, forcSync, getSyncStats },
    requestQueue: { enqueue, stats: queueStats }
  } = useNetworkContext();

  return {
    // État réseau
    isOnline,
    connectionType,
    
    // Actions
    checkConnection,
    retry,
    
    // Synchronisation
    addToSync,
    forcSync,
    getSyncStats,
    
    // Queue
    enqueue,
    queueStats
  };
}

// Hook pour les requêtes avec gestion réseau automatique
export function useNetworkFetch() {
  const { isOnline } = useNetwork();
  const { enqueue } = useRequestQueue();

  const networkFetch = async (
    url: string,
    options: RequestInit = {},
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Response> => {
    try {
      // Essayer la requête directement
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      // Si erreur réseau et hors ligne, ajouter à la queue
      if (!isOnline || (error as Error).message.includes('fetch')) {
        console.log('📋 Ajout à la queue:', url);
        return enqueue(url, options, priority);
      }
      
      // Autres erreurs, propager
      throw error;
    }
  };

  return { networkFetch, isOnline };
}

export default NetworkProvider;