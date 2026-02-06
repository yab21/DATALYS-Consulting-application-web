'use client';

import { useEffect, useState, useCallback } from 'react';
import { sseService, SSENotification } from '@/services/sse-service';

interface UseSSEOptions {
  autoConnect?: boolean;
  onNotification?: (notification: SSENotification) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { autoConnect = true, onNotification } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<SSENotification | null>(null);

  useEffect(() => {
    // S'abonner aux changements de connexion
    const unsubscribeConnection = sseService.subscribeToConnection(setIsConnected);

    // S'abonner aux notifications
    const unsubscribeNotifications = sseService.subscribe((notification) => {
      setLastNotification(notification);
      onNotification?.(notification);
    });

    // Connexion automatique
    if (autoConnect) {
      sseService.connect();
    }

    return () => {
      unsubscribeConnection();
      unsubscribeNotifications();
    };
  }, [autoConnect, onNotification]);

  const connect = useCallback(() => {
    sseService.connect();
  }, []);

  const disconnect = useCallback(() => {
    sseService.disconnect();
  }, []);

  return {
    isConnected,
    lastNotification,
    connect,
    disconnect
  };
}

export default useSSE;
