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
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
    connectionType: 'fast',
    lastConnected: null,
    retryCount: 0
  });

  // Test la qualité de la connexion
  const testConnectionQuality = useCallback(async (): Promise<'fast' | 'slow' | 'offline'> => {
    try {
      const startTime = Date.now();
      
      // Test avec une petite requête vers notre API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/proxy/health', {
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

    // Vérification initiale après un délai
    const initialCheck = setTimeout(() => {
      checkConnection();
    }, 1000);

    // Vérification périodique (toutes les 30 secondes)
    const periodicCheck = setInterval(() => {
      if (!status.isOnline) {
        checkConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheck);
      clearInterval(periodicCheck);
    };
  }, [checkConnection, status.isOnline]);

  // Vérification sur changement de visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !status.isOnline) {
        console.log('🔄 Page visible, vérification de la connexion...');
        checkConnection();
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