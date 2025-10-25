"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { notificationDeduplicator } from '@/utils/notification-deduplicator';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // en millisecondes, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useSimpleNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useSimpleNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? defaultDuration
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limiter le nombre de notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-removal si pas permanent
    if (newNotification.duration && newNotification.duration > 0 && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // État pour le throttling supplémentaire
  const lastNotificationTime = useRef<{ [key: string]: number }>({});
  const THROTTLE_DELAY = 2000; // 2 secondes de délai minimum entre notifications similaires
  
  // Écouter les événements globaux d'erreur avec déduplication
  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      const { type, title, message, persistent } = event.detail;
      
      // Première couche : déduplication globale
      const notificationKey = `${title}: ${message}`;
      if (!notificationDeduplicator.shouldShowNotification(notificationKey, type)) {
        return; // Notification dupliquée, ignorer
      }
      
      // Deuxième couche : throttling local pour les notifications de type réseau
      const now = Date.now();
      const throttleKey = type.includes('error') || title.includes('Connexion') || title.includes('Mode') ? 'network' : notificationKey;
      
      if (lastNotificationTime.current[throttleKey] && 
          (now - lastNotificationTime.current[throttleKey]) < THROTTLE_DELAY) {
        console.log(`⏱️ Notification throttlée: ${title}`);
        return; // Trop récent, ignorer
      }
      
      lastNotificationTime.current[throttleKey] = now;
      
      addNotification({
        type,
        title,
        message,
        persistent,
        duration: persistent ? 0 : defaultDuration
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('global-error-notification', handleGlobalError as EventListener);
      return () => {
        window.removeEventListener('global-error-notification', handleGlobalError as EventListener);
      };
    }
  }, [addNotification, defaultDuration]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      
      {/* Container des notifications */}
      <div className={`fixed z-[9999] max-w-sm w-full ${getPositionClasses()}`}>
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRemove={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`mb-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${getColorClasses()}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {notification.message}
          </p>
          
          {notification.action && (
            <div className="mt-2">
              <button
                onClick={notification.action.onClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={onRemove}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Barre de progression pour les notifications temporaires */}
      {notification.duration && notification.duration > 0 && !notification.persistent && (
        <motion.div
          className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: notification.duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Utilitaires d'export pour utilisation facile
export const useNotificationHelpers = () => {
  const { addNotification } = useSimpleNotifications();

  return {
    showSuccess: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    
    showError: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, ...options }),
    
    showWarning: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    
    showInfo: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),
  };
};

export default NotificationProvider;