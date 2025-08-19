"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  // État pour le temps réel sera ajouté plus tard si nécessaire

  // Les notifications sont maintenant générées uniquement par les actions utilisateur réelles
  // Plus de notifications de démo ou de test

  // Le système temps réel sera implémenté avec de vraies notifications du backend
  // Plus de simulation de notifications aléatoires

  // Fonctions utilitaires
  const generateId = (): string => {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
    // Pour l'instant, juste demander la permission pour les notifications navigateur
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Le système temps réel sera implémenté plus tard avec WebSockets/SSE
  };

  const unsubscribeFromRealTime = () => {
    // Fonction réservée pour l'implémentation future du temps réel
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