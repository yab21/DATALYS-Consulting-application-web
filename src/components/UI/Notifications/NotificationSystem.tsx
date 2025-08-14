"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Sparkles
} from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, "id">) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [newNotification, ...prev]);

    if (!notification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      hideNotification,
      clearAllNotifications,
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, hideNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => hideNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          bgClass: "bg-gradient-to-r from-emerald-500 to-green-500",
          bgLight: "bg-emerald-50 dark:bg-emerald-950/50",
          borderClass: "border-emerald-200 dark:border-emerald-800",
          iconClass: "text-emerald-600 dark:text-emerald-400",
          titleClass: "text-emerald-900 dark:text-emerald-100",
          messageClass: "text-emerald-700 dark:text-emerald-300",
        };
      case "error":
        return {
          icon: XCircle,
          bgClass: "bg-gradient-to-r from-red-500 to-rose-500",
          bgLight: "bg-red-50 dark:bg-red-950/50",
          borderClass: "border-red-200 dark:border-red-800",
          iconClass: "text-red-600 dark:text-red-400",
          titleClass: "text-red-900 dark:text-red-100",
          messageClass: "text-red-700 dark:text-red-300",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bgClass: "bg-gradient-to-r from-amber-500 to-orange-500",
          bgLight: "bg-amber-50 dark:bg-amber-950/50",
          borderClass: "border-amber-200 dark:border-amber-800",
          iconClass: "text-amber-600 dark:text-amber-400",
          titleClass: "text-amber-900 dark:text-amber-100",
          messageClass: "text-amber-700 dark:text-amber-300",
        };
      case "info":
        return {
          icon: Info,
          bgClass: "bg-gradient-to-r from-[#06B6D4] to-cyan-500",
          bgLight: "bg-cyan-50 dark:bg-cyan-950/50",
          borderClass: "border-cyan-200 dark:border-cyan-800",
          iconClass: "text-[#06B6D4] dark:text-cyan-400",
          titleClass: "text-cyan-900 dark:text-cyan-100",
          messageClass: "text-cyan-700 dark:text-cyan-300",
        };
    }
  };

  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.3 }
      }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl
        ${config.bgLight} ${config.borderClass}
        hover:shadow-3xl transition-all duration-300 cursor-pointer group
      `}
      onClick={onClose}
    >
      {/* Gradient background bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${config.bgClass}`} />
      
      {/* Sparkle effect */}
      <motion.div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Sparkles className="h-4 w-4 text-gray-400" />
      </motion.div>

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className={`
              p-2 rounded-xl ${config.bgLight} border ${config.borderClass}
              group-hover:scale-110 transition-transform duration-300
            `}>
              <Icon className={`h-5 w-5 ${config.iconClass}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-base ${config.titleClass}`}>
              {notification.title}
            </h4>
            
            {notification.message && (
              <p className={`text-sm mt-1 leading-relaxed ${config.messageClass}`}>
                {notification.message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            className={`
              flex-shrink-0 p-1 rounded-lg transition-colors duration-200
              hover:bg-gray-200 dark:hover:bg-gray-700
              ${config.iconClass} hover:opacity-70
            `}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar for timed notifications */}
        {!notification.persistent && notification.duration && notification.duration > 0 && (
          <motion.div
            className={`absolute bottom-0 left-0 h-0.5 ${config.bgClass}`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ 
              duration: notification.duration / 1000,
              ease: "linear" 
            }}
          />
        )}
      </div>

      {/* Glow effect */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300
        ${config.bgClass} blur-2xl -z-10
      `} />
    </motion.div>
  );
};

// Utility functions for easy use
export const notificationHelpers = {
  success: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: "success" as const,
    title,
    message,
    ...options,
  }),
  
  error: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: "error" as const,
    title,
    message,
    ...options,
  }),
  
  warning: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: "warning" as const,
    title,
    message,
    ...options,
  }),
  
  info: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: "info" as const,
    title,
    message,
    ...options,
  }),
};