import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  MessagePayload,
  Messaging,
} from "firebase/messaging";
import {
  firebaseConfig,
  vapidKey,
  isFirebaseConfigured,
  FCM_TOKEN_ENDPOINT,
} from "@/config/firebase";
import { SecureStorage } from "@/lib/secure-storage";
import { isTokenExpiredError } from "@/lib/api-interceptor";

class FCMService {
  private messaging: Messaging | null = null;
  private app: any = null;
  private currentToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Vérifier la configuration Firebase
      if (!isFirebaseConfigured()) {
        console.warn("Configuration Firebase incomplète");
        return false;
      }

      // Vérifier si Firebase est déjà initialisé
      if (!this.isInitialized) {
        this.app = initializeApp(firebaseConfig);
        this.messaging = getMessaging(this.app);
        this.isInitialized = true;
      }

      // Vérifier le support des notifications
      if (!("Notification" in window)) {
        console.warn("Ce navigateur ne supporte pas les notifications");
        return false;
      }

      // Vérifier le support des service workers
      if (!("serviceWorker" in navigator)) {
        console.warn("Ce navigateur ne supporte pas les service workers");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de FCM:", error);
      return false;
    }
  }

  async requestPermission(): Promise<string> {
    try {
      // Vérifier d'abord si les notifications sont supportées
      if (!("Notification" in window)) {
        console.warn("Ce navigateur ne supporte pas les notifications");
        return "denied";
      }

      // Si déjà accordée, retourner immédiatement
      if (Notification.permission === "granted") {
        console.log("Permission de notification déjà accordée");
        return "granted";
      }

      // Si déjà refusée, ne pas redemander
      if (Notification.permission === "denied") {
        console.warn(
          "Permission de notification déjà refusée par l'utilisateur",
        );
        return "denied";
      }

      // Demander la permission de manière explicite
      console.log("Demande de permission de notification...");
      const permission = await Notification.requestPermission();
      console.log("Réponse de permission de notification:", permission);

      return permission;
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error);
      return "denied";
    }
  }

  // Nouvelle méthode pour vérifier le statut des permissions
  getPermissionStatus(): string {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  // Nouvelle méthode pour savoir si on peut demander la permission
  canRequestPermission(): boolean {
    return "Notification" in window && Notification.permission === "default";
  }

  async getRegistrationToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        await this.initialize();
        if (!this.messaging) {
          throw new Error("Messaging non initialisé");
        }
      }

      // Enregistrer le service worker et attendre qu'il soit prêt
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );

      // Attendre que le service worker soit activé
      await this.waitForServiceWorkerReady(registration);

      // Obtenir le token avec retry logic
      let token = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!token && attempts < maxAttempts) {
        try {
          attempts++;

          token = await getToken(this.messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration,
          });

          if (token) {
            this.currentToken = token;

            // Sauvegarder le token localement
            localStorage.setItem("fcm-token", token);

            return token;
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            // Attendre un peu avant de réessayer
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempts),
            );
          } else {
            throw error;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de l'obtention du token:", error);
      return null;
    }
  }

  private async waitForServiceWorkerReady(
    registration: ServiceWorkerRegistration,
  ): Promise<void> {
    return new Promise((resolve) => {
      // Si le service worker est déjà actif
      if (registration.active) {
        resolve();
        return;
      }

      // Si le service worker est en cours d'installation
      if (registration.installing) {
        registration.installing.addEventListener("statechange", function () {
          if (this.state === "activated") {
            resolve();
          }
        });
        return;
      }

      // Si le service worker est en attente
      if (registration.waiting) {
        registration.waiting.addEventListener("statechange", function () {
          if (this.state === "activated") {
            resolve();
          }
        });
        return;
      }

      // Fallback: attendre un peu et résoudre
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  async sendTokenToServer(token: string, userId: number): Promise<boolean> {
    try {
      const response = await fetch(FCM_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SecureStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          token,
          user_id: userId,
          device_info: {
            userAgent: navigator.userAgent,
            platform:
              (navigator as any).userAgentData?.platform ||
              (navigator as any).platform ||
              "unknown",
            language: navigator.language,
          },
        }),
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error("Erreur lors de l'envoi du token au serveur:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        return false;
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("Erreur lors de l'envoi du token au serveur:", error);
      return false;
    }
  }

  setupForegroundMessageListener(
    addNotification: (notification: any) => void,
  ): void {
    if (!this.messaging) {
      console.warn("Messaging non initialisé");
      return;
    }

    onMessage(this.messaging, (payload: MessagePayload) => {
      // Convertir le message FCM en notification interne
      const notification = this.convertFCMToNotification(payload);

      try {
        // Ajouter au contexte React (pour l'ancien système)
        addNotification(notification);

        // AUSSI ajouter directement au localStorage (pour le nouveau bell icon)
        const existingNotifications = JSON.parse(
          localStorage.getItem("datalys-notifications") || "[]",
        );
        existingNotifications.unshift(notification);
        localStorage.setItem(
          "datalys-notifications",
          JSON.stringify(existingNotifications),
        );

        // Déclencher un événement pour forcer le refresh du bell icon
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "datalys-notifications",
            newValue: JSON.stringify(existingNotifications),
          }),
        );

        // Force l'affichage d'une notification système aussi
        this.showSystemNotification(payload);
      } catch (error) {
        console.error("Erreur lors de l'ajout de notification:", error);
      }
    });
  }

  private convertFCMToNotification(payload: MessagePayload): any {
    const data = payload.data || {};
    const notification = payload.notification || {};

    return {
      id: `fcm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || "info",
      title: notification.title || "Nouvelle notification",
      message: notification.body,
      category: data.category || "general",
      priority: data.priority || "medium",
      timestamp: new Date().toISOString(),
      read: false,
      persistent: data.priority === "critical",
      actionRequired: data.action_required === "true",
      relatedId: data.related_id ? parseInt(data.related_id) : undefined,
      fromUser: data.from_user ? JSON.parse(data.from_user) : undefined,
      metadata: {
        fcm_payload: payload,
        received_at: new Date().toISOString(),
      },
    };
  }

  private showSystemNotification(payload: MessagePayload): void {
    const title = payload.notification?.title || "DATALYS Consulting";
    const options = {
      body: payload.notification?.body || "Nouvelle notification",
      icon: "/favicon.ico",
      tag: payload.data?.id || "notification",
      data: payload.data,
      requireInteraction: payload.data?.priority === "critical",
    };

    new Notification(title, options);
  }

  async setupServiceWorkerListener(): Promise<void> {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        switch (event.data.type) {
          case "NOTIFICATION_CLICKED":
            this.handleNotificationClick(event.data.data);
            break;
          case "NOTIFICATION_CLOSED":
            this.handleNotificationClose(event.data.data);
            break;
        }
      });
    }
  }

  private handleNotificationClick(data: any): void {
    // Emettre un événement personnalisé pour que l'application puisse réagir
    window.dispatchEvent(
      new CustomEvent("fcm-notification-clicked", {
        detail: data,
      }),
    );
  }

  private handleNotificationClose(data: any): void {
    // Emettre un événement personnalisé
    window.dispatchEvent(
      new CustomEvent("fcm-notification-closed", {
        detail: data,
      }),
    );
  }

  async deleteToken(): Promise<boolean> {
    try {
      if (!this.messaging || !this.currentToken) {
        return true;
      }

      // TODO: Implémenter la suppression du token
      // await deleteToken(this.messaging);

      this.currentToken = null;
      localStorage.removeItem("fcm-token");

      return true;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("Erreur lors de la suppression du token:", error);
      return false;
    }
  }

  // Nouvelle méthode pour forcer la régénération du token
  async forceTokenRegeneration(): Promise<string | null> {
    try {
      // Nettoyer complètement l'état actuel
      this.currentToken = null;
      localStorage.removeItem("fcm-token");

      // Réinitialiser le messaging service
      if (this.messaging && this.app) {
        this.messaging = null;
        this.isInitialized = false;
      }

      // Forcer une nouvelle initialisation
      await this.initialize();

      // Obtenir un nouveau token
      const newToken = await this.getRegistrationToken();

      return newToken;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("Erreur lors de la régénération forcée:", error);
      return null;
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken || localStorage.getItem("fcm-token");
  }

  isSupported(): boolean {
    return "Notification" in window && "serviceWorker" in navigator;
  }
}

export const fcmService = new FCMService();

// Helper pour initialiser FCM avec l'utilisateur connecté
export async function initializeFCMForUser(
  userId: number,
  addNotification: (notification: any) => void,
): Promise<boolean> {
  try {
    // Vérifier le support
    if (!fcmService.isSupported()) {
      console.warn("FCM non supporté sur ce navigateur");
      return false;
    }

    // Initialiser FCM
    const initialized = await fcmService.initialize();
    if (!initialized) {
      console.error("Impossible d'initialiser FCM");
      return false;
    }

    // Demander les permissions
    const permission = await fcmService.requestPermission();
    if (permission !== "granted") {
      console.warn("Permission de notification refusée");
      return false;
    }

    // Obtenir le token
    const token = await fcmService.getRegistrationToken();
    if (!token) {
      console.error("Impossible d'obtenir le token FCM");
      return false;
    }

    // Envoyer le token au serveur (échec non critique)
    const tokenSent = await fcmService.sendTokenToServer(token, userId);
    if (!tokenSent) {
      console.warn(
        "Impossible d'envoyer le token au serveur - continuer avec les notifications locales",
      );
      // Ne pas échouer complètement, les notifications locales peuvent encore fonctionner
      // L'utilisateur peut toujours recevoir des notifications via l'interface locale
    }

    // Configurer les listeners
    fcmService.setupForegroundMessageListener(addNotification);
    await fcmService.setupServiceWorkerListener();

    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de FCM:", error);
    return false;
  }
}

// Helper pour nettoyer FCM lors de la déconnexion
export async function cleanupFCM(): Promise<void> {
  try {
    await fcmService.deleteToken();
  } catch (error) {
    console.error("Erreur lors du nettoyage de FCM:", error);
  }
}
