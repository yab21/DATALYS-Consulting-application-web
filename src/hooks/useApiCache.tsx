"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";

// Types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleTime: number;
}

interface ApiCacheOptions {
  ttl?: number; // Time to live (en ms)
  staleTime?: number; // Temps avant que les données deviennent "stale" (en ms)
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UseApiCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => void;
}

// Cache global
class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<() => void>>();

  set<T>(key: string, data: T, ttl: number, staleTime: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      staleTime,
    });
    this.notifySubscribers(key);
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Si les données ont expiré, les supprimer
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.notifySubscribers(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  isStale(key: string): boolean {
    const entry = this.get(key);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > entry.staleTime;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.notifySubscribers(key);
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(key: string): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      staleEntries: entries.filter(([key]) => this.isStale(key)).length,
      expiredEntries: entries.filter(([, entry]) => 
        (now - entry.timestamp) > entry.ttl
      ).length,
      cacheSize: JSON.stringify(Object.fromEntries(this.cache)).length,
    };
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach(callback => callback());
    });
  }
}

// Instance globale du cache
const apiCache = new ApiCache();

// Hook principal
export const useApiCache = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  options: ApiCacheOptions = {}
): UseApiCacheReturn<T> => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes par défaut
    staleTime = 2 * 60 * 1000, // 2 minutes par défaut
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    retry = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const { showNotification } = useSimpleNotifications();
  const retryCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  // Fonction pour récupérer les données
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Vérifier d'abord le cache
    const cached = apiCache.get<T>(key);
    if (cached && !forceRefresh && !apiCache.isStale(key)) {
      setDataState(cached.data);
      setIsStale(false);
      return;
    }

    // Si on a des données en cache mais stales, les afficher quand même
    if (cached && !forceRefresh) {
      setDataState(cached.data);
      setIsStale(true);
    }

    setIsLoading(true);
    setError(null);
    
    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();

    try {
      const result = await fetcher();
      
      // Mettre en cache
      apiCache.set(key, result, ttl, staleTime);
      setDataState(result);
      setIsStale(false);
      setError(null);
      retryCount.current = 0;
      
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      
      // Si on a des données en cache, continuer à les afficher
      if (!cached) {
        setError(error);
        setDataState(null);
      }
      
      // Retry logic
      if (retryCount.current < retry && error.name !== 'AbortError') {
        retryCount.current++;
        setTimeout(() => {
          fetchData(forceRefresh);
        }, retryDelay * Math.pow(2, retryCount.current - 1)); // Backoff exponentiel
      } else {
        showNotification(simpleNotificationHelpers.error(
          "Erreur de chargement",
          `Impossible de charger les données: ${error.message}`
        ));
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, staleTime, retry, retryDelay, onError, onSuccess, showNotification]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Invalider le cache
  const invalidate = useCallback(() => {
    apiCache.invalidate(key);
  }, [key]);

  // Setter pour les données
  const setData = useCallback((newData: T) => {
    apiCache.set(key, newData, ttl, staleTime);
    setDataState(newData);
    setIsStale(false);
  }, [key, ttl, staleTime]);

  // Effet pour charger les données initialement
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // S'abonner aux changements de cache
  useEffect(() => {
    const unsubscribe = apiCache.subscribe(key, () => {
      const cached = apiCache.get<T>(key);
      if (cached) {
        setDataState(cached.data);
        setIsStale(apiCache.isStale(key));
      } else {
        setDataState(null);
        setIsStale(true);
      }
    });

    return unsubscribe;
  }, [key]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (apiCache.isStale(key)) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, refetchOnWindowFocus, fetchData]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      if (apiCache.isStale(key)) {
        fetchData();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [key, refetchOnReconnect, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isStale,
    error,
    refetch,
    invalidate,
    setData,
  };
};

// Hook avec configuration prédéfinie pour différents types de données
export const useUserCache = <T,>(key: string, fetcher: () => Promise<T>) => {
  return useApiCache(key, fetcher, {
    ttl: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useProjectCache = <T,>(key: string, fetcher: () => Promise<T>) => {
  return useApiCache(key, fetcher, {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

export const useDashboardCache = <T,>(key: string, fetcher: () => Promise<T>) => {
  return useApiCache(key, fetcher, {
    ttl: 30 * 1000, // 30 secondes
    staleTime: 15 * 1000, // 15 secondes
    refetchOnWindowFocus: true,
  });
};

// Export du cache pour debug
export { apiCache };