import React from 'react';
import { AdvancedNotification } from '@/components/UI/Notifications/AdvancedNotificationProvider';
import { buildApiUrl, getDefaultHeaders } from '@/lib/api-config';
import { isTokenExpiredError } from '@/lib/api-interceptor';

export interface NotificationSubscription {
  id: string;
  userId: number;
  types: string[];
  active: boolean;
  lastPoll?: Date;
}

export interface BackendNotification {
  id: number;
  type: 'message' | 'support' | 'notification' | 'incident';
  title: string;
  description?: string;
  priority: 'basse' | 'moyenne' | 'haute' | 'critique';
  status: string;
  user_id: number;
  project_id?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
  parent_id?: number;
  metadata?: Record<string, any>;
}

export interface UnreadNotificationsResponse {
  items: BackendNotification[];
  count: number;
  message: string;
  code: number;
}

class RealtimeNotificationService {
  private pollInterval: NodeJS.Timeout | null = null;
  private pollingFrequency = 30000; // 30 secondes
  private lastPollTime: Date | null = null;
  private isPolling = false;
  private currentUserId: number | null = null;
  private callbacks: Set<(notifications: AdvancedNotification[]) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();

  constructor() {
    this.setupVisibilityHandling();
  }

  // Démarrer le polling des notifications
  startPolling(userId: number) {
    if (this.isPolling) return;

    this.currentUserId = userId;
    this.isPolling = true;
    this.pollNotifications(userId);

    this.pollInterval = setInterval(() => {
      this.pollNotifications(userId);
    }, this.pollingFrequency);

    console.log('🔔 Notification polling started');
  }

  // Arrêter le polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('🔔 Notification polling stopped');
  }

  // Récupérer les notifications non lues depuis l'API
  private async pollNotifications(_userId: number) {
    try {
      const response = await fetch(buildApiUrl('/notifications/unread'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          index: 0,
          size: 50
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UnreadNotificationsResponse = await response.json();
      
      if (data.items && data.items.length > 0) {
        const notifications = this.transformBackendNotifications(data.items);
        this.notifyCallbacks(notifications);
      }

      this.lastPollTime = new Date();

    } catch (error) {
      console.error('Error polling notifications:', error);
      this.notifyErrorCallbacks(error as Error);
    }
  }

  // Transformer les notifications backend en format frontend
  private transformBackendNotifications(backendNotifications: BackendNotification[]): AdvancedNotification[] {
    return backendNotifications.map(notification => ({
      id: `backend-${notification.id}`,
      type: this.mapBackendType(notification.type),
      title: notification.title,
      message: notification.description,
      timestamp: new Date(notification.created_at),
      read: notification.is_read,
      priority: this.mapBackendPriority(notification.priority),
      category: this.mapBackendCategory(notification.type),
      actionRequired: notification.type === 'incident' || notification.type === 'support',
      relatedId: notification.project_id || notification.id,
      fromUser: notification.assigned_to ? {
        id: notification.assigned_to,
        name: 'Administrateur',
        role: 'admin'
      } : undefined,
      metadata: {
        backendId: notification.id,
        status: notification.status,
        parentId: notification.parent_id,
        projectId: notification.project_id,
        ...notification.metadata
      }
    }));
  }

  private mapBackendType(backendType: BackendNotification['type']): AdvancedNotification['type'] {
    switch (backendType) {
      case 'message': return 'message';
      case 'support': return 'incident';
      case 'notification': return 'info';
      case 'incident': return 'incident';
      default: return 'info';
    }
  }

  private mapBackendPriority(backendPriority: BackendNotification['priority']): AdvancedNotification['priority'] {
    switch (backendPriority) {
      case 'critique': return 'critical';
      case 'haute': return 'high';
      case 'moyenne': return 'medium';
      case 'basse': return 'low';
      default: return 'medium';
    }
  }

  private mapBackendCategory(backendType: BackendNotification['type']): AdvancedNotification['category'] {
    switch (backendType) {
      case 'message': return 'communication';
      case 'support': return 'project';
      case 'notification': return 'system';
      case 'incident': return 'project';
      default: return 'general';
    }
  }

  // Marquer une notification comme lue côté backend
  async markAsRead(backendId: number): Promise<void> {
    try {
      await fetch(buildApiUrl('/notifications/mark-read'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ id: backendId })
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Envoyer une notification (pour les admins)
  async sendNotification(data: {
    title: string;
    description?: string;
    assigned_to?: number;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
    project_id?: number;
  }): Promise<void> {
    try {
      const response = await fetch(buildApiUrl('/notifications/send'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Envoyer un message
  async sendMessage(data: {
    title: string;
    description: string;
    project_id?: number;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
  }): Promise<void> {
    try {
      const response = await fetch(buildApiUrl('/messages/send'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Créer une demande de support
  async createSupportRequest(data: {
    title: string;
    description: string;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
    project_id?: number;
  }): Promise<void> {
    try {
      const response = await fetch(buildApiUrl('/support/request'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
  }

  // Récupérer les messages de l'utilisateur
  async getMyMessages(index: number = 0, size: number = 20): Promise<BackendNotification[]> {
    try {
      const response = await fetch(buildApiUrl('/messages/my-messages'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ index, size })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Gérer la visibilité de la page pour optimiser le polling
  private setupVisibilityHandling() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Réduire la fréquence quand la page n'est pas visible
          this.pollingFrequency = 120000; // 2 minutes
        } else {
          // Fréquence normale quand la page est visible
          this.pollingFrequency = 30000; // 30 secondes
        }

        // Redémarrer le polling avec la nouvelle fréquence
        if (this.isPolling && this.currentUserId) {
          this.stopPolling();
          this.startPolling(this.currentUserId);
        }
      });
    }
  }

  // S'abonner aux nouvelles notifications
  subscribe(callback: (notifications: AdvancedNotification[]) => void) {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // S'abonner aux erreurs
  subscribeToErrors(callback: (error: Error) => void) {
    this.errorCallbacks.add(callback);
    
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  private notifyCallbacks(notifications: AdvancedNotification[]) {
    this.callbacks.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: Error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  // Configurer la fréquence de polling
  setPollingFrequency(frequency: number) {
    this.pollingFrequency = frequency;
    
    // Redémarrer le polling avec la nouvelle fréquence
    if (this.isPolling && this.pollInterval) {
      clearInterval(this.pollInterval);
      // Note: Le polling redémarrera automatiquement
    }
  }

  // Obtenir les statistiques du service
  getStats() {
    return {
      isPolling: this.isPolling,
      pollingFrequency: this.pollingFrequency,
      lastPollTime: this.lastPollTime,
      callbackCount: this.callbacks.size,
      errorCallbackCount: this.errorCallbacks.size
    };
  }
}

// Instance singleton
export const realtimeNotificationService = new RealtimeNotificationService();

// Hook React pour utiliser le service
export function useRealtimeNotifications(userId?: number) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    // Démarrer le polling
    realtimeNotificationService.startPolling(userId);
    setIsConnected(true);

    // S'abonner aux erreurs
    const unsubscribeFromErrors = realtimeNotificationService.subscribeToErrors(setError);

    return () => {
      // Nettoyer lors du démontage
      realtimeNotificationService.stopPolling();
      unsubscribeFromErrors();
      setIsConnected(false);
    };
  }, [userId]);

  return {
    isConnected,
    error,
    stats: realtimeNotificationService.getStats(),
    service: realtimeNotificationService
  };
}

export default realtimeNotificationService;