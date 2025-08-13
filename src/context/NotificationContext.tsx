"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
  action?: NotificationAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'project' | 'partner' | 'security' | 'user';
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  handler: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getNotificationsByCategory: (category: string) => Notification[];
  subscribeToRealTime: () => void;
  unsubscribeFromRealTime: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  // Initialiser avec des notifications de démo
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: generateId(),
        title: "Bienvenue sur DATALYS",
        body: "Découvrez toutes les fonctionnalités de votre tableau de bord professionnel",
        type: "info",
        timestamp: new Date(),
        read: false,
        link: "/tableaudebord",
        priority: "medium",
        category: "system"
      },
      {
        id: generateId(),
        title: "Nouveau partenaire ajouté",
        body: "TechCorp Solutions a été ajouté à votre liste de partenaires",
        type: "success",
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        read: false,
        link: "/tableaudebord/partenaire/liste",
        priority: "medium",
        category: "partner"
      },
      {
        id: generateId(),
        title: "Sauvegarde automatique",
        body: "Vos données ont été sauvegardées avec succès",
        type: "success",
        timestamp: new Date(Date.now() - 3600000), // 1h ago
        read: true,
        priority: "low",
        category: "system"
      },
    ];
    
    setNotifications(initialNotifications);
  }, []);

  // Simuler des notifications temps réel
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Simuler des notifications aléatoires
      const randomNotifications = [
        {
          title: "Fichier uploadé",
          body: "Le fichier document.pdf a été ajouté au projet",
          type: "success" as const,
          priority: "low" as const,
          category: "project" as const,
          link: "/tableaudebord/projet"
        },
        {
          title: "Incident résolu",
          body: "L'incident de connectivité VPN a été résolu",
          type: "success" as const,
          priority: "medium" as const,
          category: "system" as const,
        },
        {
          title: "Nouvelle demande d'accès",
          body: "Un utilisateur demande l'accès au projet Migration Cloud",
          type: "warning" as const,
          priority: "high" as const,
          category: "user" as const,
          action: {
            label: "Gérer",
            handler: () => console.log("Gérer la demande d'accès")
          }
        }
      ];

      // Ajouter une notification aléatoire toutes les 30 secondes
      if (Math.random() > 0.7) {
        const randomNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        addNotification({
          ...randomNotif,
          read: false
        });
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Fonctions utilitaires
  const generateId = (): string => {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Notifier le navigateur si permission accordée
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.body,
        icon: '/images/logo.png',
        badge: '/images/badge.png',
        tag: newNotification.id,
      });
    }

    // Auto-supprimer les notifications anciennes (plus de 50)
    setNotifications(prev => prev.slice(0, 50));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationsByCategory = (category: string): Notification[] => {
    return notifications.filter(notif => notif.category === category);
  };

  const subscribeToRealTime = () => {
    setIsRealTimeEnabled(true);
    
    // Demander permission pour les notifications navigateur
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const unsubscribeFromRealTime = () => {
    setIsRealTimeEnabled(false);
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByCategory,
    subscribeToRealTime,
    unsubscribeFromRealTime,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook pour les notifications toast
export const useToast = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, body: string, options?: Partial<Notification>) =>
      addNotification({
        title,
        body,
        type: 'success',
        priority: 'medium',
        category: 'system',
        read: false,
        ...options,
      }),
    
    error: (title: string, body: string, options?: Partial<Notification>) =>
      addNotification({
        title,
        body,
        type: 'error',
        priority: 'high',
        category: 'system',
        read: false,
        ...options,
      }),
    
    warning: (title: string, body: string, options?: Partial<Notification>) =>
      addNotification({
        title,
        body,
        type: 'warning',
        priority: 'medium',
        category: 'system',
        read: false,
        ...options,
      }),
    
    info: (title: string, body: string, options?: Partial<Notification>) =>
      addNotification({
        title,
        body,
        type: 'info',
        priority: 'low',
        category: 'system',
        read: false,
        ...options,
      }),
  };
};