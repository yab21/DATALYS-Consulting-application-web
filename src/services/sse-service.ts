'use client';

import { SecureStorage } from '@/lib/secure-storage';

export interface SSENotification {
  id: number;
  type: 'message' | 'support' | 'notification' | 'incident';
  title: string;
  description?: string;
  priority: 'basse' | 'moyenne' | 'haute' | 'critique';
  status: string;
  user_id: number;
  project_id?: number;
  created_at: string;
  is_read: boolean;
  parent_id?: number;
  thread_ticket_number?: string;
}

type SSECallback = (notification: SSENotification) => void;
type SSEConnectionCallback = (connected: boolean) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: Set<SSECallback> = new Set();
  private connectionCallbacks: Set<SSEConnectionCallback> = new Set();
  private isConnected = false;

  private getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  connect() {
    if (this.eventSource) {
      console.log('SSE déjà connecté');
      return;
    }

    const token = SecureStorage.getItem('authToken');
    if (!token) {
      console.warn('SSE: Pas de token, connexion impossible');
      return;
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/events/stream?token=${token}`;

    console.log('🔌 SSE connexion à:', `${baseUrl}/events/stream`);

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('connected', (e) => {
        console.log('✅ SSE connecté');
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.notifyConnectionCallbacks(true);
      });

      this.eventSource.addEventListener('initial_notifications', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          console.log(`📬 ${data.count} notifications non lues`);
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: SSENotification) => {
              this.notifyCallbacks(item);
            });
          }
        } catch (error) {
          console.error('Erreur parsing initial_notifications:', error);
        }
      });

      this.eventSource.addEventListener('new_message', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          console.log('📩 Nouveau message:', data.title);
          this.notifyCallbacks(data);
        } catch (error) {
          console.error('Erreur parsing new_message:', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', () => {
        // Heartbeat silencieux pour garder la connexion active
      });

      this.eventSource.addEventListener('error', (e: Event) => {
        // Événement error personnalisé du backend (avec data)
        const messageEvent = e as MessageEvent;
        if (messageEvent.data) {
          try {
            const data = JSON.parse(messageEvent.data);
            console.error('❌ SSE erreur backend:', data.message);
          } catch {
            console.error('❌ SSE erreur:', messageEvent.data);
          }
        }
      });

      this.eventSource.onerror = (e: Event) => {
        // Erreur de connexion native EventSource
        const es = e.target as EventSource;
        if (es.readyState === EventSource.CLOSED) {
          console.warn('SSE connexion fermée par le serveur');
        } else if (es.readyState === EventSource.CONNECTING) {
          console.warn('SSE tentative de reconnexion...');
        } else {
          console.warn('SSE erreur de connexion');
        }
        this.isConnected = false;
        this.notifyConnectionCallbacks(false);
        this.reconnect();
      };

    } catch (error) {
      console.error('Erreur création EventSource:', error);
    }
  }

  private reconnect() {
    this.disconnect(false);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnexion SSE (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 5000);
    } else {
      console.warn('SSE: Nombre max de tentatives atteint');
    }
  }

  disconnect(resetAttempts = true) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;

    if (resetAttempts) {
      this.reconnectAttempts = 0;
    }

    this.notifyConnectionCallbacks(false);
    console.log('🔔 SSE déconnecté');
  }

  subscribe(callback: SSECallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  subscribeToConnection(callback: SSEConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    // Notifier immédiatement de l'état actuel
    callback(this.isConnected);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  private notifyCallbacks(notification: SSENotification) {
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erreur dans callback SSE:', error);
      }
    });
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Erreur dans callback connexion SSE:', error);
      }
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const sseService = new SSEService();
export default sseService;
