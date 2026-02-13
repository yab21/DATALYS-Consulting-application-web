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
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('datalys-notifications');
      if (stored) {
        return JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch { }
    return [];
  });

  // Fonctions utilitaires
  const generateId = (): string => {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Synchroniser avec localStorage et notifier la cloche
  const syncToLocalStorage = (updated: Notification[]) => {
    try {
      localStorage.setItem('datalys-notifications', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('datalys-notification-update'));
    } catch { }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      syncToLocalStorage(updated);
      return updated;
    });

    // Notifier le navigateur si permission accordée
    if ('Notification' in window && Notification.permission === 'granted') {
      new window.Notification(newNotification.title, {
        body: newNotification.body,
        icon: '/images/logo.png',
        tag: newNotification.id,
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      syncToLocalStorage(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      syncToLocalStorage(updated);
      return updated;
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id);
      syncToLocalStorage(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    syncToLocalStorage([]);
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
export const useSimpleNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useSimpleNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook pour les notifications toast
export const useToast = () => {
  const { addNotification } = useSimpleNotifications();

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