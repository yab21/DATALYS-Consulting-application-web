import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';
import { advancedNotificationHelpers } from '@/components/UI/Notifications/AdvancedNotificationProvider';
import { firebaseConfig, vapidKey, isFirebaseConfigured, FCM_TOKEN_ENDPOINT } from '@/config/firebase';

class FCMService {
  private messaging: Messaging | null = null;
  private app: any = null;
  private currentToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Vérifier la configuration Firebase
      if (!isFirebaseConfigured()) {
        console.warn('Configuration Firebase incomplète');
        return false;
      }

      // Vérifier si Firebase est déjà initialisé
      if (!this.isInitialized) {
        this.app = initializeApp(firebaseConfig);
        this.messaging = getMessaging(this.app);
        this.isInitialized = true;
      }

      // Vérifier le support des notifications
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications');
        return false;
      }

      // Vérifier le support des service workers
      if (!('serviceWorker' in navigator)) {
        console.warn('Ce navigateur ne supporte pas les service workers');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de FCM:', error);
      return false;
    }
  }

  async requestPermission(): Promise<string> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission de notification:', permission);
      return permission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return 'denied';
    }
  }

  async getRegistrationToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        await this.initialize();
        if (!this.messaging) {
          throw new Error('Messaging non initialisé');
        }
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker enregistré:', registration);

      // Obtenir le token
      const token = await getToken(this.messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('Token FCM reçu:', token);
        this.currentToken = token;
        
        // Sauvegarder le token localement
        localStorage.setItem('fcm-token', token);
        
        return token;
      } else {
        console.log('Aucun token de registration disponible');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  async sendTokenToServer(token: string, userId: number): Promise<boolean> {
    try {
      const response = await fetch(FCM_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          token,
          user_id: userId,
          device_info: {
            userAgent: navigator.userAgent,
            platform: (navigator as any).userAgentData?.platform || navigator.platform,
            language: navigator.language
          }
        })
      });

      if (response.ok) {
        console.log('Token FCM envoyé au serveur avec succès');
        return true;
      } else {
        console.error('Erreur lors de l\'envoi du token au serveur');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du token au serveur:', error);
      return false;
    }
  }

  setupForegroundMessageListener(addNotification: (notification: any) => void): void {
    if (!this.messaging) {
      console.warn('Messaging non initialisé');
      return;
    }

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Message reçu en premier plan:', payload);

      // Convertir le message FCM en notification interne
      const notification = this.convertFCMToNotification(payload);
      addNotification(notification);

      // Afficher une notification système si l'utilisateur n'est pas sur la page
      if (document.hidden) {
        this.showSystemNotification(payload);
      }
    });
  }

  private convertFCMToNotification(payload: MessagePayload): any {
    const data = payload.data || {};
    const notification = payload.notification || {};

    return {
      type: data.type || 'info',
      title: notification.title || 'Nouvelle notification',
      message: notification.body,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      persistent: data.priority === 'critical',
      actionRequired: data.action_required === 'true',
      relatedId: data.related_id ? parseInt(data.related_id) : undefined,
      fromUser: data.from_user ? JSON.parse(data.from_user) : undefined,
      metadata: {
        fcm_payload: payload,
        timestamp: new Date().toISOString()
      }
    };
  }

  private showSystemNotification(payload: MessagePayload): void {
    const title = payload.notification?.title || 'DATALYS Consulting';
    const options = {
      body: payload.notification?.body || 'Nouvelle notification',
      icon: '/favicon.ico',
      tag: payload.data?.id || 'notification',
      data: payload.data,
      requireInteraction: payload.data?.priority === 'critical'
    };

    new Notification(title, options);
  }

  async setupServiceWorkerListener(): Promise<void> {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message reçu du service worker:', event.data);

        switch (event.data.type) {
          case 'NOTIFICATION_CLICKED':
            this.handleNotificationClick(event.data.data);
            break;
          case 'NOTIFICATION_CLOSED':
            this.handleNotificationClose(event.data.data);
            break;
        }
      });
    }
  }

  private handleNotificationClick(data: any): void {
    console.log('Notification cliquée:', data);
    
    // Emettre un événement personnalisé pour que l'application puisse réagir
    window.dispatchEvent(new CustomEvent('fcm-notification-clicked', {
      detail: data
    }));
  }

  private handleNotificationClose(data: any): void {
    console.log('Notification fermée:', data);
    
    // Emettre un événement personnalisé
    window.dispatchEvent(new CustomEvent('fcm-notification-closed', {
      detail: data
    }));
  }

  async deleteToken(): Promise<boolean> {
    try {
      if (!this.messaging || !this.currentToken) {
        return true;
      }

      // TODO: Implémenter la suppression du token
      // await deleteToken(this.messaging);
      
      this.currentToken = null;
      localStorage.removeItem('fcm-token');
      
      console.log('Token FCM supprimé');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken || localStorage.getItem('fcm-token');
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const fcmService = new FCMService();

// Helper pour initialiser FCM avec l'utilisateur connecté
export async function initializeFCMForUser(
  userId: number, 
  addNotification: (notification: any) => void
): Promise<boolean> {
  try {
    // Vérifier le support
    if (!fcmService.isSupported()) {
      console.warn('FCM non supporté sur ce navigateur');
      return false;
    }

    // Initialiser FCM
    const initialized = await fcmService.initialize();
    if (!initialized) {
      console.error('Impossible d\'initialiser FCM');
      return false;
    }

    // Demander les permissions
    const permission = await fcmService.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission de notification refusée');
      return false;
    }

    // Obtenir le token
    const token = await fcmService.getRegistrationToken();
    if (!token) {
      console.error('Impossible d\'obtenir le token FCM');
      return false;
    }

    // Envoyer le token au serveur
    const tokenSent = await fcmService.sendTokenToServer(token, userId);
    if (!tokenSent) {
      console.warn('Impossible d\'envoyer le token au serveur');
      // Ne pas échouer complètement, les notifications locales peuvent encore fonctionner
    }

    // Configurer les listeners
    fcmService.setupForegroundMessageListener(addNotification);
    await fcmService.setupServiceWorkerListener();

    console.log('FCM initialisé avec succès pour l\'utilisateur', userId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de FCM:', error);
    return false;
  }
}

// Helper pour nettoyer FCM lors de la déconnexion
export async function cleanupFCM(): Promise<void> {
  try {
    await fcmService.deleteToken();
    console.log('FCM nettoyé');
  } catch (error) {
    console.error('Erreur lors du nettoyage de FCM:', error);
  }
}