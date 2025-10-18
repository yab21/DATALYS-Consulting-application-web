import { useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useRequestQueue } from '@/lib/request-queue';
import { errorHandler } from '@/lib/error-handler';

export interface SyncableData {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  attempts: number;
  maxAttempts: number;
}

export interface SyncConfig {
  enableAutoSync: boolean;
  syncInterval: number; // en millisecondes
  maxRetries: number;
  syncOnReconnect: boolean;
  syncOnVisibilityChange: boolean;
}

const defaultSyncConfig: SyncConfig = {
  enableAutoSync: true,
  syncInterval: 30000, // 30 secondes
  maxRetries: 3,
  syncOnReconnect: true,
  syncOnVisibilityChange: true
};

export function useNetworkSync(config: Partial<SyncConfig> = {}) {
  const syncConfig = { ...defaultSyncConfig, ...config };
  const { isOnline } = useNetworkStatus();
  const { processQueue } = useRequestQueue();
  
  const syncDataRef = useRef<SyncableData[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);
  const isConnectedRef = useRef(isOnline);

  // Charger les données de sync depuis le localStorage
  const loadSyncData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('datalys-sync-data');
      if (saved) {
        syncDataRef.current = JSON.parse(saved);
        console.log(`📋 ${syncDataRef.current.length} élément(s) de sync chargé(s)`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de sync:', error);
      syncDataRef.current = [];
    }
  }, []);

  // Sauvegarder les données de sync
  const saveSyncData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('datalys-sync-data', JSON.stringify(syncDataRef.current));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de sync:', error);
    }
  }, []);

  // Ajouter un élément à synchroniser
  const addToSync = useCallback((
    type: SyncableData['type'],
    endpoint: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const syncItem: SyncableData = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      priority,
      attempts: 0,
      maxAttempts: syncConfig.maxRetries
    };

    syncDataRef.current.push(syncItem);
    saveSyncData();
    
    console.log(`📋 Ajouté à la sync: ${type} ${endpoint}`);
    
    // Essayer de synchroniser immédiatement si en ligne
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline, syncConfig.maxRetries, saveSyncData]);

  // Traiter la queue de synchronisation
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncDataRef.current.length === 0) {
      return;
    }

    console.log(`🔄 Traitement de ${syncDataRef.current.length} élément(s) de sync...`);
    
    // Trier par priorité et timestamp
    const sortedItems = [...syncDataRef.current].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.timestamp - b.timestamp;
    });

    const successful: string[] = [];
    const failed: SyncableData[] = [];

    for (const item of sortedItems) {
      try {
        await processSyncItem(item);
        successful.push(item.id);
        console.log(`✅ Sync réussie: ${item.type} ${item.endpoint}`);
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= item.maxAttempts) {
          console.error(`❌ Sync échouée définitivement: ${item.type} ${item.endpoint}`, error);
          failed.push(item);
        } else {
          console.warn(`⚠️ Sync échouée (${item.attempts}/${item.maxAttempts}): ${item.type} ${item.endpoint}`, error);
          failed.push(item);
        }
      }
    }

    // Mettre à jour la queue
    syncDataRef.current = failed.filter(item => item.attempts < item.maxAttempts);
    saveSyncData();

    lastSyncRef.current = new Date();
    
    if (successful.length > 0) {
      console.log(`✅ ${successful.length} élément(s) synchronisé(s) avec succès`);
    }
    
    if (failed.length > 0) {
      console.log(`❌ ${failed.filter(item => item.attempts >= item.maxAttempts).length} élément(s) échoué(s) définitivement`);
    }
  }, [isOnline, saveSyncData]);

  // Traiter un élément de sync individuel
  const processSyncItem = async (item: SyncableData): Promise<void> => {
    let method: string;
    let body: BodyInit | undefined;

    switch (item.type) {
      case 'create':
        method = 'POST';
        body = JSON.stringify(item.data);
        break;
      case 'update':
        method = 'PUT';
        body = JSON.stringify(item.data);
        break;
      case 'delete':
        method = 'DELETE';
        body = item.data ? JSON.stringify(item.data) : undefined;
        break;
      default:
        throw new Error(`Type de sync non supporté: ${item.type}`);
    }

    const response = await fetch(item.endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Ajouter les headers d'authentification si nécessaire
        ...getAuthHeaders()
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  };

  // Obtenir les headers d'authentification
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch (error) {
      console.warn('Impossible de récupérer le token d\'authentification:', error);
    }
    
    return {};
  };

  // Démarrer la synchronisation périodique
  const startPeriodicSync = useCallback(() => {
    if (!syncConfig.enableAutoSync) return;
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      if (isOnline && syncDataRef.current.length > 0) {
        processSyncQueue();
      }
    }, syncConfig.syncInterval);
    
    console.log(`⏱️ Sync périodique démarrée (${syncConfig.syncInterval}ms)`);
  }, [syncConfig.enableAutoSync, syncConfig.syncInterval, isOnline, processSyncQueue]);

  // Arrêter la synchronisation périodique
  const stopPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
      console.log('⏹️ Sync périodique arrêtée');
    }
  }, []);

  // Forcer une synchronisation immédiate
  const forcSync = useCallback(() => {
    console.log('🔄 Synchronisation forcée...');
    processSyncQueue();
  }, [processSyncQueue]);

  // Vider la queue de sync
  const clearSyncQueue = useCallback(() => {
    syncDataRef.current = [];
    saveSyncData();
    console.log('🗑️ Queue de sync vidée');
  }, [saveSyncData]);

  // Obtenir les statistiques de sync
  const getSyncStats = useCallback(() => {
    const stats = {
      totalItems: syncDataRef.current.length,
      pendingItems: syncDataRef.current.filter(item => item.attempts < item.maxAttempts).length,
      failedItems: syncDataRef.current.filter(item => item.attempts >= item.maxAttempts).length,
      lastSync: lastSyncRef.current,
      itemsByType: {
        create: syncDataRef.current.filter(item => item.type === 'create').length,
        update: syncDataRef.current.filter(item => item.type === 'update').length,
        delete: syncDataRef.current.filter(item => item.type === 'delete').length
      },
      itemsByPriority: {
        high: syncDataRef.current.filter(item => item.priority === 'high').length,
        medium: syncDataRef.current.filter(item => item.priority === 'medium').length,
        low: syncDataRef.current.filter(item => item.priority === 'low').length
      }
    };
    
    return stats;
  }, []);

  // Effets pour gérer la synchronisation
  useEffect(() => {
    loadSyncData();
  }, [loadSyncData]);

  useEffect(() => {
    if (syncConfig.enableAutoSync) {
      startPeriodicSync();
    } else {
      stopPeriodicSync();
    }
    
    return () => stopPeriodicSync();
  }, [syncConfig.enableAutoSync, startPeriodicSync, stopPeriodicSync]);

  // Synchronisation au retour de connexion
  useEffect(() => {
    const wasOffline = !isConnectedRef.current;
    const isNowOnline = isOnline;
    
    if (syncConfig.syncOnReconnect && wasOffline && isNowOnline) {
      console.log('🌐 Connexion rétablie, démarrage de la synchronisation...');
      
      // Attendre un peu pour que la connexion soit stable
      setTimeout(() => {
        processSyncQueue();
        // Traiter aussi la queue de requêtes normales
        processQueue();
      }, 1000);
    }
    
    isConnectedRef.current = isOnline;
  }, [isOnline, syncConfig.syncOnReconnect, processSyncQueue, processQueue]);

  // Synchronisation sur changement de visibilité
  useEffect(() => {
    if (!syncConfig.syncOnVisibilityChange) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && isOnline && syncDataRef.current.length > 0) {
        console.log('👁️ Page visible, synchronisation...');
        processSyncQueue();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncConfig.syncOnVisibilityChange, isOnline, processSyncQueue]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopPeriodicSync();
      saveSyncData();
    };
  }, [stopPeriodicSync, saveSyncData]);

  return {
    // Méthodes principales
    addToSync,
    forcSync,
    clearSyncQueue,
    
    // Informations
    getSyncStats,
    isOnline,
    lastSync: lastSyncRef.current,
    
    // Contrôles
    startPeriodicSync,
    stopPeriodicSync,
    
    // Données
    syncQueue: syncDataRef.current
  };
}

// Hook simplifié pour l'usage basique
export function useAutoSync() {
  const { addToSync, isOnline } = useNetworkSync();
  
  const syncCreate = useCallback((endpoint: string, data: any, priority?: 'low' | 'medium' | 'high') => {
    if (isOnline) {
      // Si en ligne, envoyer directement
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Si hors ligne, ajouter à la sync
      addToSync('create', endpoint, data, priority);
      return Promise.resolve(new Response('{"status":"queued"}', { status: 202 }));
    }
  }, [addToSync, isOnline]);
  
  const syncUpdate = useCallback((endpoint: string, data: any, priority?: 'low' | 'medium' | 'high') => {
    if (isOnline) {
      return fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      addToSync('update', endpoint, data, priority);
      return Promise.resolve(new Response('{"status":"queued"}', { status: 202 }));
    }
  }, [addToSync, isOnline]);
  
  const syncDelete = useCallback((endpoint: string, data?: any, priority?: 'low' | 'medium' | 'high') => {
    if (isOnline) {
      return fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });
    } else {
      addToSync('delete', endpoint, data, priority);
      return Promise.resolve(new Response('{"status":"queued"}', { status: 202 }));
    }
  }, [addToSync, isOnline]);
  
  return {
    syncCreate,
    syncUpdate,
    syncDelete,
    isOnline
  };
}

export default useNetworkSync;