"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X
} from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface SimpleNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface SimpleNotificationContextType {
  notifications: SimpleNotification[];
  showNotification: (notification: Omit<SimpleNotification, "id">) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const SimpleNotificationContext = createContext<SimpleNotificationContextType | undefined>(undefined);

export const useSimpleNotifications = () => {
  const context = useContext(SimpleNotificationContext);
  if (!context) {
    throw new Error("useSimpleNotifications must be used within a SimpleNotificationProvider");
  }
  return context;
};

interface SimpleNotificationProviderProps {
  children: ReactNode;
}

export const SimpleNotificationProvider: React.FC<SimpleNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);

  const showNotification = useCallback((notification: Omit<SimpleNotification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: SimpleNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000,
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
    <SimpleNotificationContext.Provider value={{
      notifications,
      showNotification,
      hideNotification,
      clearAllNotifications,
    }}>
      {children}
      <SimpleNotificationContainer />
    </SimpleNotificationContext.Provider>
  );
};

const SimpleNotificationContainer: React.FC = () => {
  const { notifications, hideNotification } = useSimpleNotifications();

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <SimpleNotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => hideNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface SimpleNotificationItemProps {
  notification: SimpleNotification;
  onClose: () => void;
}

const SimpleNotificationItem: React.FC<SimpleNotificationItemProps> = ({ notification, onClose }) => {
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          bgLight: "bg-emerald-50 dark:bg-emerald-950/50",
          borderClass: "border-emerald-200 dark:border-emerald-800",
          iconClass: "text-emerald-600 dark:text-emerald-400",
          titleClass: "text-emerald-900 dark:text-emerald-100",
          messageClass: "text-emerald-700 dark:text-emerald-300",
        };
      case "error":
        return {
          icon: XCircle,
          bgLight: "bg-red-50 dark:bg-red-950/50",
          borderClass: "border-red-200 dark:border-red-800",
          iconClass: "text-red-600 dark:text-red-400",
          titleClass: "text-red-900 dark:text-red-100",
          messageClass: "text-red-700 dark:text-red-300",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bgLight: "bg-amber-50 dark:bg-amber-950/50",
          borderClass: "border-amber-200 dark:border-amber-800",
          iconClass: "text-amber-600 dark:text-amber-400",
          titleClass: "text-amber-900 dark:text-amber-100",
          messageClass: "text-amber-700 dark:text-amber-300",
        };
      case "info":
        return {
          icon: Info,
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
        relative overflow-hidden rounded-lg border shadow-lg
        ${config.bgLight} ${config.borderClass}
        hover:shadow-xl transition-shadow duration-200 cursor-pointer
      `}
      onClick={onClose}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconClass}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${config.titleClass}`}>
              {notification.title}
            </h4>
            
            {notification.message && (
              <p className={`text-xs mt-1 ${config.messageClass}`}>
                {notification.message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            className={`
              flex-shrink-0 p-1 rounded transition-colors duration-200
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
      </div>
    </motion.div>
  );
};

// Utility functions for easy use
export const simpleNotificationHelpers = {
  success: (title: string, message?: string, options?: Partial<SimpleNotification>) => ({
    type: "success" as const,
    title,
    message,
    ...options,
  }),
  
  error: (title: string, message?: string, options?: Partial<SimpleNotification>) => ({
    type: "error" as const,
    title,
    message,
    ...options,
  }),
  
  warning: (title: string, message?: string, options?: Partial<SimpleNotification>) => ({
    type: "warning" as const,
    title,
    message,
    ...options,
  }),
  
  info: (title: string, message?: string, options?: Partial<SimpleNotification>) => ({
    type: "info" as const,
    title,
    message,
    ...options,
  }),
};