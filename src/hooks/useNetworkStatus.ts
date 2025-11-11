import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  connectionType: 'fast' | 'slow' | 'offline';
  lastConnected: Date | null;
  retryCount: number;
}

export interface NetworkStatusHook extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  retry: () => void;
  resetRetryCount: () => void;
}

export function useNetworkStatus(): NetworkStatusHook {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
    connectionType: 'fast',
    lastConnected: null,
    retryCount: 0
  });

  // Test la qualité de la connexion
  const testConnectionQuality = useCallback(async (): Promise<'fast' | 'slow' | 'offline'> => {
    // Retourner offline si on est côté serveur
    if (typeof window === 'undefined') {
      return 'offline';
    }
    
    try {
      const startTime = Date.now();
      
      // Test avec une petite requête vers notre API health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        return duration < 1000 ? 'fast' : 'slow';
      }
      
      return 'offline';
    } catch (error) {
      return 'offline';
    }
  }, []);

  // Vérifie la connexion
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const connectionType = await testConnectionQuality();
      const isOnline = connectionType !== 'offline';
      
      setStatus(prev => ({
        ...prev,
        isOnline,
        isConnecting: false,
        connectionType,
        lastConnected: isOnline ? new Date() : prev.lastConnected
      }));
      
      return isOnline;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
        connectionType: 'offline'
      }));
      
      return false;
    }
  }, [testConnectionQuality]);

  // Retry avec incrémentation du compteur
  const retry = useCallback(() => {
    setStatus(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    checkConnection();
  }, [checkConnection]);

  // Reset du compteur de retry
  const resetRetryCount = useCallback(() => {
    setStatus(prev => ({ ...prev, retryCount: 0 }));
  }, []);

  // Écouteurs d'événements réseau
  useEffect(() => {
    // Ne pas ajouter d'événements côté serveur
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      console.log('🌐 Connexion détectée, vérification...');
      checkConnection();
    };

    const handleOffline = () => {
      console.log('📵 Perte de connexion détectée');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        connectionType: 'offline',
        isConnecting: false
      }));
    };

    // Écouteurs d'événements du navigateur
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérification initiale après un délai plus long pour laisser le temps à la page de se charger
    const initialCheck = setTimeout(() => {
      // Seulement si on n'est pas en ligne selon le navigateur
      if (!navigator.onLine) {
        checkConnection();
      }
    }, 3000);

    // Vérification périodique moins fréquente (toutes les 60 secondes au lieu de 30)
    const periodicCheck = setInterval(() => {
      if (!status.isOnline && !navigator.onLine) {
        checkConnection();
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheck);
      clearInterval(periodicCheck);
    };
  }, [checkConnection, status.isOnline]);

  // Vérification sur changement de visibilité
  useEffect(() => {
    // Ne pas ajouter d'événements côté serveur
    if (typeof window === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      // Ajouter un délai et vérifier aussi le statut du navigateur
      if (!document.hidden && !status.isOnline && !navigator.onLine) {
        console.log('🔄 Page visible, vérification de la connexion...');
        // Délai pour éviter les vérifications immédiates lors du changement d'onglet
        setTimeout(() => {
          if (!document.hidden) { // Re-vérifier si la page est toujours visible
            checkConnection();
          }
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkConnection, status.isOnline]);

  return {
    ...status,
    checkConnection,
    retry,
    resetRetryCount
  };
}

// Hook simplifié pour les cas d'usage basiques
export function useOnlineStatus(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

// Les types sont déjà exportés dans les interfaces ci-dessus