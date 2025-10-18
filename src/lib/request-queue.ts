import { useState, useEffect } from 'react';
import { extractBackendMessage } from './error-handler';

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
  metadata?: {
    description?: string;
    component?: string;
    userId?: number;
  };
}

export interface RequestQueueStats {
  total: number;
  pending: number;
  failed: number;
  processing: boolean;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private failedQueue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;
  private retryDelay = 1000; // 1 seconde
  private processingCallbacks: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
    
    // Écouteur pour traiter la queue quand la connexion revient
    window.addEventListener('online', () => {
      console.log('🔄 Connexion rétablie, traitement de la queue...');
      this.processQueue();
    });

    // Sauvegarde périodique
    setInterval(() => {
      this.saveToStorage();
    }, 30000);
  }

  // Ajouter une requête à la queue
  async enqueue(
    url: string, 
    options: RequestInit = {}, 
    priority: 'low' | 'medium' | 'high' = 'medium',
    maxRetries: number = 3,
    metadata?: QueuedRequest['metadata']
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Vérifier la taille de la queue
      if (this.queue.length >= this.maxQueueSize) {
        // Supprimer les plus anciennes requêtes de faible priorité
        this.queue = this.queue.filter(req => req.priority !== 'low').slice(-this.maxQueueSize + 1);
      }

      const queuedRequest: QueuedRequest = {
        id: this.generateId(),
        url,
        options,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
        priority,
        resolve,
        reject,
        metadata
      };

      // Insérer selon la priorité
      const insertIndex = this.findInsertPosition(priority);
      this.queue.splice(insertIndex, 0, queuedRequest);

      console.log(`📋 Requête ajoutée à la queue: ${url} (priorité: ${priority})`);
      
      // Essayer de traiter immédiatement si en ligne
      if (navigator.onLine && !this.isProcessing) {
        this.processQueue();
      }

      this.saveToStorage();
    });
  }

  // Traiter la queue
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notifyProcessingCallbacks();

    console.log(`🔄 Traitement de ${this.queue.length} requête(s) en attente...`);

    while (this.queue.length > 0 && navigator.onLine) {
      const request = this.queue.shift()!;
      
      try {
        console.log(`📤 Traitement requête: ${request.url}`);
        const response = await this.executeRequest(request);
        
        if (response.ok) {
          console.log(`✅ Requête réussie: ${request.url}`);
          request.resolve(response);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`❌ Échec requête: ${request.url}`, error);
        await this.handleRequestFailure(request, error);
      }

      // Délai entre les requêtes pour ne pas surcharger
      await this.delay(100);
    }

    this.isProcessing = false;
    this.saveToStorage();
    console.log('✅ Traitement de la queue terminé');
  }

  // Exécuter une requête
  private async executeRequest(request: QueuedRequest): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(request.url, {
        ...request.options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  // Gérer l'échec d'une requête
  private async handleRequestFailure(request: QueuedRequest, error: any): Promise<void> {
    request.retryCount++;

    if (request.retryCount < request.maxRetries && navigator.onLine) {
      console.log(`🔄 Retry ${request.retryCount}/${request.maxRetries} pour: ${request.url}`);
      
      // Ajouter un délai exponentiel
      const delay = this.retryDelay * Math.pow(2, request.retryCount - 1);
      await this.delay(delay);
      
      // Remettre en queue avec priorité plus basse
      const newPriority = request.priority === 'high' ? 'medium' : 'low';
      const insertIndex = this.findInsertPosition(newPriority);
      this.queue.splice(insertIndex, 0, { ...request, priority: newPriority });
    } else {
      // Échec définitif
      console.error(`💥 Échec définitif pour: ${request.url}`, error);
      this.failedQueue.push(request);
      
      const message = extractBackendMessage(error);
      request.reject(new Error(message));
    }
  }

  // Trouver la position d'insertion selon la priorité
  private findInsertPosition(priority: 'low' | 'medium' | 'high'): number {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const weight = priorityWeight[priority];

    for (let i = 0; i < this.queue.length; i++) {
      if (priorityWeight[this.queue[i].priority] < weight) {
        return i;
      }
    }

    return this.queue.length;
  }

  // Obtenir les statistiques de la queue
  getStats(): RequestQueueStats {
    return {
      total: this.queue.length + this.failedQueue.length,
      pending: this.queue.length,
      failed: this.failedQueue.length,
      processing: this.isProcessing
    };
  }

  // Vider les requêtes échouées
  clearFailedQueue(): void {
    console.log(`🗑️ Suppression de ${this.failedQueue.length} requête(s) échouée(s)`);
    this.failedQueue = [];
    this.saveToStorage();
  }

  // Réessayer toutes les requêtes échouées
  retryFailedRequests(): void {
    console.log(`🔄 Nouvelle tentative pour ${this.failedQueue.length} requête(s) échouée(s)`);
    
    this.failedQueue.forEach(request => {
      request.retryCount = 0; // Reset retry count
      const insertIndex = this.findInsertPosition(request.priority);
      this.queue.splice(insertIndex, 0, request);
    });
    
    this.failedQueue = [];
    this.processQueue();
  }

  // Ajouter un callback pour les changements de traitement
  onProcessingChange(callback: () => void): () => void {
    this.processingCallbacks.push(callback);
    
    // Retourner une fonction de nettoyage
    return () => {
      const index = this.processingCallbacks.indexOf(callback);
      if (index > -1) {
        this.processingCallbacks.splice(index, 1);
      }
    };
  }

  // Notifier les callbacks
  private notifyProcessingCallbacks(): void {
    this.processingCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erreur dans callback de traitement:', error);
      }
    });
  }

  // Utilitaires
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Persistance
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        queue: this.queue.map(req => ({
          ...req,
          resolve: undefined, // Ne pas sauvegarder les callbacks
          reject: undefined
        })),
        failedQueue: this.failedQueue.map(req => ({
          ...req,
          resolve: undefined,
          reject: undefined
        }))
      };
      
      localStorage.setItem('datalys-request-queue', JSON.stringify(data));
    } catch (error) {
      console.warn('Impossible de sauvegarder la queue:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('datalys-request-queue');
      if (saved) {
        const data = JSON.parse(saved);
        // Note: Les callbacks resolve/reject ne peuvent pas être restaurés
        // Ces requêtes seront traitées mais leurs réponses seront perdues
        console.log('📋 Queue restaurée depuis le stockage');
      }
    } catch (error) {
      console.warn('Impossible de restaurer la queue:', error);
    }
  }
}

// Instance singleton
export const requestQueue = new RequestQueue();

// Hook React pour utiliser la queue
export function useRequestQueue() {
  const [stats, setStats] = useState<RequestQueueStats>(requestQueue.getStats());

  useEffect(() => {
    const updateStats = () => setStats(requestQueue.getStats());
    
    // Mettre à jour les stats périodiquement
    const interval = setInterval(updateStats, 1000);
    
    // Écouter les changements de traitement
    const unsubscribe = requestQueue.onProcessingChange(updateStats);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return {
    stats,
    enqueue: requestQueue.enqueue.bind(requestQueue),
    processQueue: requestQueue.processQueue.bind(requestQueue),
    retryFailedRequests: requestQueue.retryFailedRequests.bind(requestQueue),
    clearFailedQueue: requestQueue.clearFailedQueue.bind(requestQueue)
  };
}