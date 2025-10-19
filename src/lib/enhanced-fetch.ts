import { errorHandler } from './error-handler';
import { requestQueue } from './request-queue';

export interface EnhancedFetchOptions extends RequestInit {
  // Options de retry
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Options de queue
  enableQueue?: boolean;
  queuePriority?: 'low' | 'medium' | 'high';
  
  // Options de cache/offline
  enableCache?: boolean;
  cacheKey?: string;
  fallbackData?: any;
  
  // Metadata pour debugging
  component?: string;
  description?: string;
  
  // Timeout personnalisé
  timeout?: number;
}

/**
 * Fonction fetch améliorée avec gestion réseau automatique
 */
export async function enhancedFetch(
  url: string, 
  options: EnhancedFetchOptions = {}
): Promise<Response> {
  const {
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableQueue = true,
    queuePriority = 'medium',
    enableCache = true,
    cacheKey,
    fallbackData,
    component = 'unknown',
    description,
    timeout = 30000,
    ...fetchOptions
  } = options;

  // Créer un contrôleur d'abort avec timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Ajouter le signal d'abort aux options
    const finalOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal
    };

    // Tentative de requête directe
    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId);

    // Vérifier si la réponse est ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Mettre en cache si demandé et réponse ok
    if (enableCache && response.ok) {
      await cacheResponse(url, response.clone(), cacheKey);
    }

    return response;

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Analyser l'erreur avec l'error handler
    const errorDetails = errorHandler.analyzeError(error, {
      url,
      method: fetchOptions.method || 'GET',
      component,
      action: description
    });

    // Si c'est une erreur réseau et que la queue est activée
    if (errorDetails.type === 'network' && enableQueue && navigator.onLine === false) {
      console.log('📋 Connexion perdue, ajout à la queue:', url);
      
      // Ajouter à la queue pour retry automatique
      return requestQueue.enqueue(url, fetchOptions, queuePriority, maxRetries, {
        description: description || `Request to ${url}`,
        component
      });
    }

    // Si retry est activé et c'est une erreur retryable
    if (enableRetry && errorDetails.retryable && navigator.onLine) {
      console.log('🔄 Retry automatique pour:', url);
      
      return errorHandler.retryWithBackoff(
        () => fetch(url, fetchOptions),
        `${component}_${url}`,
        {
          maxRetries,
          baseDelay: retryDelay,
          retryCondition: (err) => err.retryable && err.type !== 'auth'
        }
      );
    }

    // Essayer le fallback/cache si disponible
    if (enableCache && (errorDetails.type === 'network' || errorDetails.fallbackAvailable)) {
      const cachedResponse = await getCachedResponse(url, cacheKey);
      if (cachedResponse) {
        console.log('📦 Utilisation du cache pour:', url);
        return cachedResponse;
      }

      // Utiliser les données de fallback si fournies
      if (fallbackData) {
        console.log('🔄 Utilisation des données de fallback pour:', url);
        return new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Gérer l'erreur via l'error handler
    await errorHandler.handleNetworkError(error, { url, options: fetchOptions }, queuePriority);
    
    // Propager l'erreur
    throw error;
  }
}

/**
 * Wrapper pour les requêtes GET avec cache automatique
 */
export async function enhancedGet(
  url: string,
  options: Omit<EnhancedFetchOptions, 'method'> = {}
): Promise<Response> {
  return enhancedFetch(url, {
    ...options,
    method: 'GET',
    enableCache: options.enableCache !== false // Cache activé par défaut pour GET
  });
}

/**
 * Wrapper pour les requêtes POST
 */
export async function enhancedPost(
  url: string,
  data: any,
  options: Omit<EnhancedFetchOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return enhancedFetch(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    enableCache: false // Pas de cache pour POST par défaut
  });
}

/**
 * Wrapper pour les requêtes PUT
 */
export async function enhancedPut(
  url: string,
  data: any,
  options: Omit<EnhancedFetchOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return enhancedFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    enableCache: false
  });
}

/**
 * Wrapper pour les requêtes DELETE
 */
export async function enhancedDelete(
  url: string,
  options: Omit<EnhancedFetchOptions, 'method'> = {}
): Promise<Response> {
  return enhancedFetch(url, {
    ...options,
    method: 'DELETE',
    enableCache: false
  });
}

/**
 * Mettre en cache une réponse
 */
async function cacheResponse(url: string, response: Response, customKey?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const key = customKey || `cache_${btoa(url)}`;
    const data = await response.text();
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
      url
    };

    localStorage.setItem(key, JSON.stringify(cacheEntry));
    
    // Nettoyer le cache ancien (plus de 1 heure)
    cleanupCache();
  } catch (error) {
    console.warn('Erreur lors de la mise en cache:', error);
  }
}

/**
 * Récupérer une réponse du cache
 */
async function getCachedResponse(url: string, customKey?: string): Promise<Response | null> {
  if (typeof window === 'undefined') return null;

  try {
    const key = customKey || `cache_${btoa(url)}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;

    const cacheEntry = JSON.parse(cached);
    
    // Vérifier si le cache n'est pas trop ancien (1 heure)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - cacheEntry.timestamp > oneHour) {
      localStorage.removeItem(key);
      return null;
    }

    // Créer une réponse à partir du cache
    return new Response(cacheEntry.data, {
      status: cacheEntry.status,
      headers: cacheEntry.headers
    });
  } catch (error) {
    console.warn('Erreur lors de la lecture du cache:', error);
    return null;
  }
}

/**
 * Nettoyer le cache ancien
 */
function cleanupCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheEntry = JSON.parse(cached);
            if (now - cacheEntry.timestamp > oneHour) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Cache entry corrompu, le supprimer
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors du nettoyage du cache:', error);
  }
}

/**
 * Vider tout le cache
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ ${keysToRemove.length} entrées de cache supprimées`);
  } catch (error) {
    console.error('Erreur lors de la suppression du cache:', error);
  }
}

/**
 * Obtenir les statistiques du cache
 */
export function getCacheStats(): {
  entries: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
} {
  if (typeof window === 'undefined') {
    return { entries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
  }

  let entries = 0;
  let totalSize = 0;
  let oldestTimestamp = Infinity;
  let newestTimestamp = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          entries++;
          totalSize += cached.length;
          
          try {
            const cacheEntry = JSON.parse(cached);
            if (cacheEntry.timestamp < oldestTimestamp) {
              oldestTimestamp = cacheEntry.timestamp;
            }
            if (cacheEntry.timestamp > newestTimestamp) {
              newestTimestamp = cacheEntry.timestamp;
            }
          } catch {
            // Ignorer les entrées corrompues
          }
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors du calcul des statistiques de cache:', error);
  }

  return {
    entries,
    totalSize,
    oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : null,
    newestEntry: newestTimestamp !== 0 ? new Date(newestTimestamp) : null
  };
}

export default enhancedFetch;